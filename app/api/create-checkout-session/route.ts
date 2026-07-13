import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

// ── Stripe client — server-side only ──────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ── Standard bouquet prices (cents) ────────────────────────────
const UNIT_AMOUNTS: Record<string, number> = {
  S: 3500,  // 35 EUR
  M: 4500,  // 45 EUR
  L: 6000,  // 60 EUR
}

const BOUQUET_NAMES: Record<string, string> = {
  S: 'Buket S — Luroni Cvijeće',
  M: 'Buket M — Luroni Cvijeće',
  L: 'Buket L — Luroni Cvijeće',
}

// ── Custom budget validation ────────────────────────────────────
// Change these three values to adjust the allowed range.
// Keep in sync with CUSTOM_PRICE_* in OrderForm.tsx and CustomBouquetCard.tsx
const CUSTOM_BUDGET_MIN  = 70
const CUSTOM_BUDGET_MAX  = 200
const CUSTOM_BUDGET_STEP = 10

function isValidCustomBudget(v: unknown): v is number {
  return (
    typeof v === 'number' &&
    Number.isInteger(v) &&
    v >= CUSTOM_BUDGET_MIN &&
    v <= CUSTOM_BUDGET_MAX &&
    v % CUSTOM_BUDGET_STEP === 0
  )
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
    customBudget?: unknown
    customerEmail: string
    customerName:  string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { orderId, bouquetSize, customBudget, customerEmail, customerName } = body

  if (!orderId || !bouquetSize) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    )
  }

  // ── Resolve unit amount and product name ───────────────────
  let unitAmount: number
  let productName: string

  if (bouquetSize === 'Buket po želji') {
    // Server-side validation: never trust the frontend price
    if (!isValidCustomBudget(customBudget)) {
      return NextResponse.json(
        {
          error:
            `Invalid customBudget. Must be an integer multiple of ${CUSTOM_BUDGET_STEP} ` +
            `between ${CUSTOM_BUDGET_MIN} and ${CUSTOM_BUDGET_MAX}.`,
        },
        { status: 400 },
      )
    }
    unitAmount  = customBudget * 100  // EUR → cents
    productName = `Buket po želji (${customBudget} €) — Luroni Cvijeće`
  } else {
    if (!UNIT_AMOUNTS[bouquetSize]) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 },
      )
    }
    unitAmount  = UNIT_AMOUNTS[bouquetSize]
    productName = BOUQUET_NAMES[bouquetSize]
  }

  const origin =
    req.headers.get('origin') ?? 'https://www.luroni-cvijece.com'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency:     'eur',
            unit_amount:  unitAmount,
            product_data: {
              name:        productName,
              description: 'Ručno složeni buket s dostavom',
            },
          },
          quantity: 1,
        },
      ],
      mode:           'payment',
      customer_email: customerEmail || undefined,
      client_reference_id: orderId,
      metadata: {
        orderId,
        bouquetSize,
        customerName:  customerName || '',
        ...(bouquetSize === 'Buket po želji' ? { customBudget: String(customBudget) } : {}),
      },
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
