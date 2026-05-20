import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

// ── Stripe client — server-side only ──────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ── Price table (cents) ────────────────────────────────────────
const UNIT_AMOUNTS: Record<string, number> = {
  S: 3500,  // 35.00 EUR
  M: 4500,  // 45.00 EUR
  L: 6000,  // 60.00 EUR
}

const BOUQUET_NAMES: Record<string, string> = {
  S: 'Buket S — Luroni Cvijeće',
  M: 'Buket M — Luroni Cvijeće',
  L: 'Buket L — Luroni Cvijeće',
}

// ── POST /api/create-checkout-session ─────────────────────────
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'Payment not configured' },
      { status: 500 },
    )
  }

  let body: {
    orderId:       string
    bouquetSize:   string
    customerEmail: string
    customerName:  string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId, bouquetSize, customerEmail, customerName } = body

  if (!orderId || !bouquetSize || !UNIT_AMOUNTS[bouquetSize]) {
    return NextResponse.json(
      { error: 'Missing or invalid parameters' },
      { status: 400 },
    )
  }

  // Derive origin from the incoming request so the same code works on both
  // localhost and production without an extra env var.
  const origin =
    req.headers.get('origin') ?? 'https://www.luroni-cvijece.com'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency:     'eur',
            unit_amount:  UNIT_AMOUNTS[bouquetSize],
            product_data: {
              name:        BOUQUET_NAMES[bouquetSize],
              description: 'Ručno složeni buket s dostavom',
            },
          },
          quantity: 1,
        },
      ],
      mode:           'payment',
      // Pre-fill the customer's email on the Stripe Checkout page
      customer_email: customerEmail || undefined,
      // Passed back in the success URL and in webhook events (once added)
      client_reference_id: orderId,
      metadata: {
        orderId,
        bouquetSize,
        customerName: customerName || '',
      },
      // {CHECKOUT_SESSION_ID} is a Stripe template variable — replaced at redirect time
      success_url: `${origin}/narudzba-uspjesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/narudzba-otkazana`,
      locale:      'hr',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe] Failed to create checkout session:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }
}
