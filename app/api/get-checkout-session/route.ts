import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { ga4PurchaseFromCheckoutSession } from '@/lib/ga4Purchase'

// ── GET /api/get-checkout-session?session_id=cs_xxx ───────────
//
// Returns a minimal, sanitised subset of a Stripe Checkout session
// so the client can fire a GA4 purchase event without ever seeing
// the Stripe secret key.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Fallback amounts if amount_total is missing (edge case only, fresh bouquets)
const BOUQUET_AMOUNTS: Record<string, number> = { S: 45, M: 55, L: 70 }

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Session not paid' }, { status: 402 })
    }

    const mapped = ga4PurchaseFromCheckoutSession(
      {
        id: session.id,
        payment_intent: session.payment_intent,
        amount_total: session.amount_total,
        metadata: session.metadata,
      },
      BOUQUET_AMOUNTS,
    )

    if ('error' in mapped) {
      console.error(`[get-checkout-session] ${mapped.error} — session ${sessionId}`)
      return NextResponse.json({ error: mapped.error }, { status: 500 })
    }

    console.log(
      `[get-checkout-session] ✓ session ${sessionId} — ` +
      `itemId: ${mapped.itemId}, value: ${mapped.value} EUR`,
    )

    return NextResponse.json(mapped)

  } catch (err) {
    console.error('[get-checkout-session] Stripe error:', err)
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 },
    )
  }
}
