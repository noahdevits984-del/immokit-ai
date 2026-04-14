import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  agency: process.env.STRIPE_PRICE_AGENCY ?? '',
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe non configuré.' }, { status: 503 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

    const { plan } = await req.json()
    const priceId = PRICE_IDS[plan]
    if (!priceId) return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })

    const { data: profile } = await supabase.from('profiles').select('email, stripe_customer_id').eq('id', user.id).single()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://immokit.ai'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: profile?.email ?? user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard?cancelled=true`,
      metadata: { userId: user.id, plan },
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Erreur lors de la création du paiement.' }, { status: 500 })
  }
}
