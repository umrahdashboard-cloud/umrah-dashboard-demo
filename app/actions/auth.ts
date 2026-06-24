'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isDemoMode } from '@/lib/is-demo'

async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) return true // CAPTCHA not configured — allow login

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

export async function login(formData: FormData) {
  if (isDemoMode()) {
    return { error: 'Demo mode active — use the demo login button.' }
  }

  // Verify Turnstile CAPTCHA if configured
  const turnstileToken = formData.get('cf_turnstile_token') as string | null
  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return { error: 'CAPTCHA verification required. Please complete the challenge.' }
    }
    const valid = await verifyTurnstile(turnstileToken)
    if (!valid) {
      return { error: 'CAPTCHA verification failed. Please try again.' }
    }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: staffUser } = await supabase
      .from('staff_users').select('status').eq('id', user.id).single()
    if (staffUser?.status === 'Inactive') {
      await supabase.auth.signOut()
      return { error: 'Your account is inactive. Contact admin.' }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  if (isDemoMode()) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('demo_session')
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}
