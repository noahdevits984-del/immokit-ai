import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const PLAN_CREDITS: Record<string, number> = {
  starter: 10,
  pro: 50,
  agency: 9999,
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: 'Configuration manquante.' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const plan = session.metadata?.plan

    if (userId && plan) {
      const credits = PLAN_CREDITS[plan] ?? 10
      await supabase.from('profiles').update({
        plan,
        credits,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId)

      // Apply referral discount if applicable
      const { data: referral } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referred_user_id', userId)
        .eq('status', 'pending')
        .single()

      if (referral) {
        await supabase.from('referrals').update({ status: 'rewarded' }).eq('referred_user_id', userId)
        // Mark referrer for discount on next renewal
        await supabase.from('profiles').update({ referral_discount: true }).eq('id', referral.referrer_id)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      await supabase.from('profiles').update({
        plan: 'free',
        credits: 3,
        stripe_subscription_id: null,
      }).eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
