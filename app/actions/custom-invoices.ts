'use server'

import { revalidatePath } from 'next/cache'
import { isDemoMode } from '@/lib/is-demo'
import { demoStore } from '@/lib/demo-store'
import type { CustomInvoiceLineItem } from '@/lib/types'

const PATHS = ['/custom-invoices']

export async function createCustomInvoice(payload: {
  invoice_date: string
  billed_to_name: string
  billed_to_address: string
  billed_to_client_number: string
  payment_bank_name: string
  payment_account_number: string
  terms_text: string
  contact_phone: string
  contact_email: string
  contact_location: string
  line_items: CustomInvoiceLineItem[]
  total: number
  received: number
  remaining: number
}) {
  if (isDemoMode()) {
    const inv = demoStore.addCustomInvoice(payload)
    PATHS.forEach(p => revalidatePath(p))
    return { success: true, invoice_number: inv.invoice_number, id: inv.id }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('custom_invoices')
    .insert({ ...payload, line_items: JSON.stringify(payload.line_items) })
    .select('invoice_number, id')
    .single()
  if (error) return { error: error.message }

  PATHS.forEach(p => revalidatePath(p))
  return { success: true, invoice_number: data.invoice_number, id: data.id }
}

export async function deleteCustomInvoice(id: string) {
  if (isDemoMode()) {
    demoStore.deleteCustomInvoice(id)
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase.from('custom_invoices').delete().eq('id', id)
  }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function saveInvoiceSettings(payload: {
  payment_bank_name: string
  payment_account_number: string
  terms_text: string
  contact_phone: string
  contact_email: string
  contact_location: string
}) {
  if (isDemoMode()) {
    demoStore.updateInvoiceSettings(payload)
    return { success: true }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Upsert — invoice_settings is a single-row table
  const { data: existing } = await supabase.from('invoice_settings').select('id').maybeSingle()
  if (existing?.id) {
    await supabase.from('invoice_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
  } else {
    await supabase.from('invoice_settings').insert(payload)
  }
  return { success: true }
}
