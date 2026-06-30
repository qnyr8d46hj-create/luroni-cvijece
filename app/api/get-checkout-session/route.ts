import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

// ── GET /api/get-checkout-session?session_id=cs_xxx ───────────
//
// Returns a minimal, sanitised subset of a Stripe Checkout session
// so the client can fire a GA4 purchase event without ever seeing
// the Stripe secret key.
//
// Guards:
//   - session_id must start with "cs_" (rejects arbitrary strings)
//   - payment_status must be "paid" (rejects unpaid / test sessions)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Fallback amounts in case amount_total is missing (should not happen)
const BOUQUET_AMOUNTS: Record<string, number> = { S: 35, M: 45, L: 60 }

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Refuse to return data for sessions that were not paid
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Session not paid' }, { status: 402 })
    }

    const bouquetSize = session.metadata?.bouquetSize ?? ''
    const value = session.amount_total != null
      ? session.amount_total / 100                     // cents → EUR
      : (BOUQUET_AMOUNTS[bouquetSize] ?? 0)            // fallback

    console.log(
      `[get-checkout-session] ✓ session ${sessionId} — ` +
      `bouquetSize: ${bouquetSize}, value: ${value} EUR`,
    )

    return NextResponse.json({
      transactionId: String(session.payment_intent ?? session.id),
      value,
      currency:    'EUR',
      bouquetSize,
    })

  } catch (err) {
    console.error('[get-checkout-session] Stripe error:', err)
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 },
    )
  }
}
