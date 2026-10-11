import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { isOrderingBlocked, ORDER_BLOCK_NOTICE } from '@/lib/orderAvailability'
import { getPurchasableArtificialBouquet } from '@/lib/artificialBouquets'
import { parseArtificialOrderRequest } from '@/lib/artificialOrderRequest'
import { buildTrustedArtificialOrder } from '@/lib/trustedArtificialOrder'
import { artificialStripeMetadata, artificialStripeProductName } from '@/lib/artificialCheckout'
import { canBindStripeSession } from '@/lib/artificialPaymentGuard'
import {
  EMAIL_OUTBOX_COLLECTION,
  enqueueOutboxInTransaction,
  flushEmailOutbox,
  orderEmailPayloadFromDocument,
  plannedOutboxEntries,
} from '@/lib/orderEmailOutbox'
import { FieldValue } from '@/lib/firebaseAdmin'
import {
  ARTIFICIAL_CHECKOUT_DISABLED_NOTICE,
  isArtificialCheckoutEnabled,
} from '@/lib/artificialCheckoutEnabled'

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })
}

export async function POST(req: NextRequest) {
  if (!isArtificialCheckoutEnabled()) {
    return NextResponse.json({ error: ARTIFICIAL_CHECKOUT_DISABLED_NOTICE }, { status: 503 })
  }

  if (isOrderingBlocked()) {
    return NextResponse.json({ error: ORDER_BLOCK_NOTICE }, { status: 503 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = parseArtificialOrderRequest(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const product = await getPurchasableArtificialBouquet(parsed.data.sku)
  if (!product) {
    return NextResponse.json(
      { error: 'Product is unavailable or inactive' },
      { status: 400 },
    )
  }

  const trusted = buildTrustedArtificialOrder(parsed.data, product)
  if ('error' in trusted) {
    return NextResponse.json({ error: trusted.error }, { status: 400 })
  }

  const { adminDb } = await import('@/lib/firebaseAdmin')
  const orderRef = adminDb.collection('orders').doc()

  if (parsed.data.paymentMethod === 'cash') {
    const payload = orderEmailPayloadFromDocument({
      ...trusted,
      bouquetSize: '',
    })
    await adminDb.runTransaction(async t => {
      t.set(orderRef, {
        ...trusted,
        createdAt: FieldValue.serverTimestamp(),
      })
      enqueueOutboxInTransaction(
        t,
        id => adminDb.collection(EMAIL_OUTBOX_COLLECTION).doc(id),
        plannedOutboxEntries(orderRef.id, payload, 'cash'),
        payload,
      )
    })

    const flush = await flushEmailOutbox(adminDb, orderRef.id, payload)
    const merchantEmailStatus = flush.failed.includes('merchant_cash') ? 'pending_retry' : 'sent'
    await orderRef.update({ merchantEmailStatus })
    if (flush.failed.length > 0) {
      console.error('[artificial-order] cash email outbox still pending:', flush.failed)
    }
    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      merchantEmailStatus,
    })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
  }

  await orderRef.set({
    ...trusted,
    createdAt: FieldValue.serverTimestamp(),
  })

  const origin = req.headers.get('origin') ?? 'https://www.luroni-cvijece.com'
  const unitAmount = trusted.expectedAmountCents as number
  const stripe = stripeClient()

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: unitAmount,
            product_data: {
              name: artificialStripeProductName(product.name, product.sku),
              description: 'Umjetni cvjetni aranžman s dostavom',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: parsed.data.email || undefined,
      client_reference_id: orderRef.id,
      metadata: artificialStripeMetadata(orderRef.id, product.sku, product.name),
      success_url: `${origin}/narudzba-uspjesna?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/narudzba-otkazana`,
      locale: 'hr',
    })
  } catch (err) {
    console.error('[artificial-order] Stripe session create failed:', err)
    await orderRef.update({
      status: 'checkout_failed',
      checkoutError: 'stripe_session_create_failed',
    })
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  try {
    const bound = await adminDb.runTransaction(async t => {
      const snap = await t.get(orderRef)
      const data = snap.data() ?? {}
      if (data.status === 'paid') {
        return { ok: false as const, reason: 'already_paid' }
      }
      if (!canBindStripeSession(data.stripeSessionId, session.id)) {
        return { ok: false as const, reason: 'session_conflict', existing: String(data.stripeSessionId) }
      }
      t.update(orderRef, {
        stripeSessionId: session.id,
        stripeCheckoutUrl: session.url ?? null,
      })
      return { ok: true as const }
    })

    if (!bound.ok) {
      try {
        await stripe.checkout.sessions.expire(session.id)
      } catch (err) {
        console.error('[artificial-order] Failed to expire competing session:', err)
      }
      return NextResponse.json({ error: 'Checkout session already bound' }, { status: 409 })
    }
  } catch (err) {
    console.error('[artificial-order] Failed to persist Stripe session id:', err)
    return NextResponse.json(
      {
        error: 'Checkout session created but not yet bound; retry is safe',
        orderId: orderRef.id,
        url: session.url,
      },
      { status: 200 },
    )
  }

  return NextResponse.json({ url: session.url, orderId: orderRef.id })
}
