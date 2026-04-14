import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Profile = {
  id: string
  email: string
  full_name: string
  agency: string
  credits: number
  plan: 'free' | 'starter' | 'pro' | 'agency'
  kits_generated: number
  created_at: string
}

export type Kit = {
  id: string
  user_id: string
  property_type: string
  city: string
  price: string
  surface: string
  tone: string
  language: string
  contents: Record<string, string>
  created_at: string
}
