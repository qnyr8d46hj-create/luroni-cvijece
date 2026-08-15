import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { OCCASION_PRODUCT_ID, getOccasionById } from '@/lib/occasions'

// ── GET /api/get-checkout-session?session_id=cs_xxx ───────────
//
// Returns a minimal, sanitised subset of a Stripe Checkout session
// so the client can fire a GA4 purchase event without ever seeing
// the Stripe secret key.

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// Fallback amounts if amount_total is missing (edge case only)
const BOUQUET_AMOUNTS: Record<string, number> = { S: 35, M: 45, L: 60 }

function bouquetDisplayName(size: string, occasionId?: string): string {
  if (size === OCCASION_PRODUCT_ID) {
    return getOccasionById(occasionId ?? '')?.title ?? 'Prigoda'
  }
  if (size === 'Buket po želji') return 'Buket po želji'
  return `Buket ${size}`
}

function bouquetItemId(size: string, occasionId?: string): string {
  if (size === OCCASION_PRODUCT_ID) {
    return occasionId ? `prigoda-${occasionId}` : 'prigoda'
  }
  if (size === 'Buket po želji') return 'buket-po-zelji'
  return `buket-${size.toLowerCase()}`
}

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

    const bouquetSize = session.metadata?.bouquetSize ?? ''
    const occasionId  = session.metadata?.occasion ?? ''
    const occasionBudgetFallback = Number(session.metadata?.occasion_budget)
    const value = session.amount_total != null
      ? session.amount_total / 100
      : (BOUQUET_AMOUNTS[bouquetSize]
        ?? (Number.isInteger(occasionBudgetFallback) ? occasionBudgetFallback : 0))

    console.log(
      `[get-checkout-session] ✓ session ${sessionId} — ` +
      `bouquetSize: ${bouquetSize}, value: ${value} EUR`,
    )

    return NextResponse.json({
      transactionId: String(session.payment_intent ?? session.id),
      value,
      currency:    'EUR',
      bouquetSize,
      itemName:    bouquetDisplayName(bouquetSize, occasionId),
      itemId:      bouquetItemId(bouquetSize, occasionId),
    })

  } catch (err) {
    console.error('[get-checkout-session] Stripe error:', err)
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 },
    )
  }
}
