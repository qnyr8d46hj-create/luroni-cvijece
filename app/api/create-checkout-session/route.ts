import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { isOrderingBlocked, ORDER_BLOCK_NOTICE, getUnavailableDeliveryMessage } from '@/lib/orderAvailability'
import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import { adminDb } from '@/lib/firebaseAdmin'
import {
  assessFreshCardOrder,
  freshCheckoutRequestAgrees,
  planFreshCheckoutStart,
  planFreshSessionBind,
} from '@/lib/freshCheckout'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

function isSafeOrderId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 && !value.includes('/')
}

async function expireUnboundSession(sessionId: string) {
  try {
    await stripe.checkout.sessions.expire(sessionId)
  } catch (err) {
    console.error(`[Stripe] Failed to expire unbound session ${sessionId}:`, err)
  }
}

// ── POST /api/create-checkout-session ─────────────────────────
export async function POST(req: NextRequest) {
  if (isOrderingBlocked()) {
    return NextResponse.json({ error: ORDER_BLOCK_NOTICE }, { status: 503 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[Stripe] STRIPE_SECRET_KEY is not set')
    return NextResponse.json(
      { error: 'Payment not configured' },
      { status: 500 },
    )
  }

  let body: {
    orderType?:    string
    orderId?:      unknown
    bouquetSize?:  unknown
    customBudget?: unknown
    customerEmail?: string
    customerName?:  string
    deliveryDate?: string
    deliveryTime?: string
    sku?:          string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.orderType === ARTIFICIAL_ORDER_TYPE) {
    return NextResponse.json(
      { error: 'Artificial orders must be created through /api/create-artificial-order' },
      { status: 400 },
    )
  }

  if (!isSafeOrderId(body.orderId)) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  const orderRef = adminDb.collection('orders').doc(body.orderId)
  const orderSnap = await orderRef.get()
  if (!orderSnap.exists) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const order = (orderSnap.data() ?? {}) as Record<string, unknown>
  const assessed = assessFreshCardOrder(order)
  if (!assessed.ok) {
    return NextResponse.json({ error: assessed.error }, { status: 400 })
  }

  const slotError = getUnavailableDeliveryMessage(
    typeof order.deliveryDate === 'string' ? order.deliveryDate : '',
    typeof order.deliveryTime === 'string' ? order.deliveryTime : '',
  )
  if (slotError) {
    return NextResponse.json({ error: slotError }, { status: 400 })
  }

  if (!freshCheckoutRequestAgrees(assessed.quote, body)) {
    return NextResponse.json(
      { error: 'Checkout request does not match the saved bouquet' },
      { status: 409 },
    )
  }

  const start = planFreshCheckoutStart(order, assessed.quote)
  if (start.action === 'reuse') {
    return NextResponse.json({ url: start.url })
  }
  if (start.action === 'reject') {
    return NextResponse.json({ error: start.error }, { status: 409 })
  }

  const quote = assessed.quote
  const origin = req.headers.get('origin') ?? 'https://www.luroni-cvijece.com'
  const customerEmail = typeof order.email === 'string' ? order.email.trim() : ''
  const customerName = typeof order.fullName === 'string' ? order.fullName.trim() : ''

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: quote.amountCents,
            product_data: {
              name: quote.productName,
              description: 'Ručno složeni buket s dostavom',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      client_reference_id: body.orderId,
      metadata: {
        orderId: body.orderId,
        bouquetSize: quote.bouquetSize,
        customerName,
        ...(quote.customBudget != null ? { customBudget: String(quote.customBudget) } : {}),
      },
      success_url: `${origin}/narudzba-uspjesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/narudzba-otkazana`,
      locale: 'hr',
    })
  } catch (err) {
    console.error('[Stripe] Failed to create checkout session:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    )
  }

  if (!session.id || !session.url) {
    if (session.id) await expireUnboundSession(session.id)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  try {
    const bound = await adminDb.runTransaction(async t => {
      const snap = await t.get(orderRef)
      if (!snap.exists) return { ok: false as const, reason: 'missing' as const, error: 'Order not found' }
      const current = (snap.data() ?? {}) as Record<string, unknown>
      const plan = planFreshSessionBind(current, session.id, quote.amountCents)
      if (!plan.ok) return plan
      t.update(orderRef, {
        ...plan.update,
        stripeCheckoutUrl: session.url ?? null,
      })
      return { ok: true as const }
    })

    if (!bound.ok) {
      await expireUnboundSession(session.id)
      const status = bound.reason === 'not_payable' ? 400 : bound.reason === 'missing' ? 404 : 409
      return NextResponse.json({ error: bound.error }, { status })
    }
  } catch (err) {
    console.error('[Stripe] Failed to bind checkout session:', err)
    await expireUnboundSession(session.id)
    return NextResponse.json(
      { error: 'Failed to bind checkout session' },
      { status: 500 },
    )
  }

  return NextResponse.json({ url: session.url })
}
