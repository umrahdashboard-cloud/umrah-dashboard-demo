/**
 * Data abstraction layer.
 * In demo mode  → reads/writes from the in-memory demoStore (no Supabase needed).
 * In production → queries Supabase.
 */

import { isDemoMode } from './is-demo'
import { demoStore } from './demo-store'
import type { Airline, Hotel, Booking, Payment, Expense, StaffUser, VisaSettings, CurrencySettings, TransportRate, Company, InvoiceSettings, CustomInvoice } from './types'

async function getSupabase() {
  const { createClient } = await import('./supabase/server')
  return createClient()
}

// ── Airlines ────────────────────────────────────────────────────────────────

export async function getAirlines(): Promise<Airline[]> {
  if (isDemoMode()) return [...demoStore.airlines].sort((a, b) => a.name.localeCompare(b.name))
  const sb = await getSupabase()
  const { data } = await sb.from('airlines').select('*').order('name')
  return data ?? []
}

// ── Hotels ───────────────────────────────────────────────────────────────────

export async function getHotels(): Promise<Hotel[]> {
  if (isDemoMode()) return [...demoStore.hotels].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
  const sb = await getSupabase()
  const { data } = await sb.from('hotels').select('*').order('city').order('name')
  return data ?? []
}

// ── Visa settings ────────────────────────────────────────────────────────────

export async function getVisa(): Promise<VisaSettings> {
  if (isDemoMode()) return { ...demoStore.visa }
  const sb = await getSupabase()
  const { data } = await sb.from('visa_settings').select('*').single()
  if (!data) return {
    id: '',
    visa_rate_1_pax: 725,
    visa_rate_2_pax: 700,
    visa_rate_3_pax: 675,
    visa_rate_4_pax: 650,
    visa_rate_group_pax: 600,
    child_sar: 600,
    infant_sar: 460,
    transport_mode: 'included' as const,
    makkah_ziarat_rate: 0,
    madina_ziarat_rate: 0,
  }
  // Coerce any columns that may be null if migration hasn't run yet
  return {
    ...data,
    visa_rate_1_pax:     data.visa_rate_1_pax     ?? 725,
    visa_rate_2_pax:     data.visa_rate_2_pax     ?? 700,
    visa_rate_3_pax:     data.visa_rate_3_pax     ?? 675,
    visa_rate_4_pax:     data.visa_rate_4_pax     ?? 650,
    visa_rate_group_pax: data.visa_rate_group_pax ?? 600,
    makkah_ziarat_rate:  data.makkah_ziarat_rate  ?? 0,
    madina_ziarat_rate:  data.madina_ziarat_rate  ?? 0,
  }
}

// ── Currency ─────────────────────────────────────────────────────────────────

export async function getCurrency(): Promise<CurrencySettings> {
  if (isDemoMode()) return { ...demoStore.currency }
  const sb = await getSupabase()
  const { data } = await sb.from('currency_settings').select('*').single()
  return data ?? { id: '', sar_to_pkr: 75 }
}

// ── Transport rates ───────────────────────────────────────────────────────────

export async function getTransportRates(): Promise<TransportRate[]> {
  if (isDemoMode()) return [...demoStore.transportRates]
  const sb = await getSupabase()
  const { data } = await sb.from('transport_rates').select('*').order('type').order('pax_count')
  return data ?? []
}

// ── Company ───────────────────────────────────────────────────────────────────

export async function getCompany(): Promise<Company> {
  if (isDemoMode()) return { ...demoStore.company }
  const sb = await getSupabase()
  const { data } = await sb.from('company').select('*').single()
  return data ?? { id: '', name: 'Fast Travels & Tours', license: 'Govt License', phone: '', website: 'fasttravels.pk', address: 'Pakistan', logo_url: '' }
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export async function getBookings(): Promise<Booking[]> {
  if (isDemoMode()) return [...demoStore.bookings]
  const sb = await getSupabase()
  const { data } = await sb.from('bookings').select('*').order('created_at', { ascending: false })
  return data ?? []
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPayments(): Promise<Payment[]> {
  if (isDemoMode()) return [...demoStore.payments]
  const sb = await getSupabase()
  const { data } = await sb.from('payments').select('*').order('created_at', { ascending: false })
  return data ?? []
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  if (isDemoMode()) return [...(demoStore.expenses ?? [])]
  const sb = await getSupabase()
  const { data } = await sb.from('expenses').select('*').order('created_at', { ascending: false })
  return data ?? []
}

// ── Invoice Settings ─────────────────────────────────────────────────────────

export async function getInvoiceSettings(): Promise<InvoiceSettings | null> {
  if (isDemoMode()) return demoStore.invoiceSettings ? { ...demoStore.invoiceSettings } : null
  const sb = await getSupabase()
  const { data } = await sb.from('invoice_settings').select('*').maybeSingle()
  return data ?? null
}

// ── Custom Invoices ──────────────────────────────────────────────────────────

export async function getCustomInvoices(): Promise<CustomInvoice[]> {
  if (isDemoMode()) return [...demoStore.customInvoices]
  const sb = await getSupabase()
  const { data } = await sb.from('custom_invoices').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(row => ({
    ...row,
    line_items: typeof row.line_items === 'string' ? JSON.parse(row.line_items) : row.line_items,
  })) as CustomInvoice[]
}

// ── Staff users ───────────────────────────────────────────────────────────────

export async function getStaff(): Promise<StaffUser[]> {
  if (isDemoMode()) return [...demoStore.staff]
  const sb = await getSupabase()
  const { data } = await sb.from('staff_users').select('*').order('created_at', { ascending: false })
  return data ?? []
}
