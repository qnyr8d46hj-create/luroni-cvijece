import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, FieldValue }            from '@/lib/firebaseAdmin'
import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import {
  assertArtificialPaidSession,
  resolveCheckoutOrderId,
} from '@/lib/artificialPaymentGuard'
import {
  EMAIL_OUTBOX_COLLECTION,
  enqueueOutboxInTransaction,
  flushEmailOutbox,
  orderEmailPayloadFromDocument,
  plannedOutboxEntries,
} from '@/lib/orderEmailOutbox'
import {
  sendOrderNotificationEmail,
  type OrderEmailPayload,
} from '@/lib/sendOrderEmail'

class PermanentPaymentError extends Error {}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function POST(req: NextRequest) {
  console.log('[Webhook] POST /api/stripe/webhook received')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] FATAL: STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const rawBody   = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature verification FAILED:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event)
        break
      default:
        console.log(`[Webhook] Unhandled event type "${event.type}" — acknowledged silently`)
    }
  } catch (err) {
    if (err instanceof PermanentPaymentError) {
      console.error(`[Webhook] Permanent payment error for ${event.id}:`, err.message)
      return NextResponse.json({ received: true, error: err.message })
    }
    console.error(`[Webhook] Handler threw for ${event.type} (${event.id}):`, err)
    return NextResponse.json({ error: 'Handler failed — will retry' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== 'paid') {
    console.warn(`[Webhook][${event.id}] payment_status is "${session.payment_status}" — skipping`)
    return
  }

  const orderId =
    (session.client_reference_id ?? '').trim() ||
    (session.metadata?.orderId   ?? '').trim() ||
    null

  if (!orderId) {
    console.error(`[Webhook][${event.id}] Cannot resolve orderId from session ${session.id}`)
    return
  }

  const orderRef = adminDb.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()
  if (!orderSnap.exists) {
    console.error(`[Webhook][${event.id}] Document orders/${orderId} does NOT exist`)
    return
  }

  const orderData = (orderSnap.data() ?? {}) as Record<string, unknown>
  if (orderData.orderType === ARTIFICIAL_ORDER_TYPE) {
    await completeArtificialPaidOrder(event, session, orderId)
    return
  }

  await completeFreshPaidOrder(event, session, orderId, orderData)
}

async function completeFreshPaidOrder(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  orderId: string,
  orderData: Record<string, unknown>,
) {
  const orderRef = adminDb.collection('orders').doc(orderId)

  if (orderData.stripeEventId === event.id) {
    console.log(`[Webhook][${event.id}] Fresh order already processed for this event — skipping`)
    return
  }

  await orderRef.update({
    status:              'paid',
    stripeEventId:       event.id,
    stripeSessionId:     session.id,
    stripePaymentIntent: session.payment_intent ?? null,
    stripeAmountTotal:   session.amount_total   ?? null,
    stripeCurrency:      session.currency       ?? null,
    paidAt:              FieldValue.serverTimestamp(),
  })

  const emailPayload: OrderEmailPayload = {
    fullName:        String(orderData.fullName        ?? ''),
    phone:           String(orderData.phone           ?? ''),
    email:           String(orderData.email           ?? ''),
    deliveryAddress: String(orderData.deliveryAddress ?? ''),
    deliveryCity:    String(orderData.deliveryCity    ?? ''),
    bouquetSize:     String(orderData.bouquetSize     ?? ''),
    bouquetPrice:    typeof orderData.bouquetPrice === 'number' ? orderData.bouquetPrice : null,
    customBudget:    typeof orderData.customBudget  === 'number' ? orderData.customBudget  : null,
    deliveryDate:    String(orderData.deliveryDate    ?? ''),
    deliveryTime:    String(orderData.deliveryTime    ?? ''),
    cardMessage:     String(orderData.cardMessage     ?? ''),
    paymentMethod:   String(orderData.paymentMethod   ?? 'card'),
  }

  try {
    const emailResult = await sendOrderNotificationEmail(emailPayload)
    if (emailResult.success) {
      console.log(`[Webhook][${event.id}] ✓ Fresh merchant email sent`)
    } else {
      console.error(`[Webhook][${event.id}] Fresh merchant email FAILED: ${emailResult.error}`)
    }
  } catch (err) {
    console.error(`[Webhook][${event.id}] Fresh merchant email threw:`, err)
  }
}

async function completeArtificialPaidOrder(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  orderId: string,
) {
  const sessionView = {
    id: session.id,
    payment_status: session.payment_status,
    currency: session.currency ?? null,
    amount_total: session.amount_total ?? null,
    client_reference_id: session.client_reference_id,
    metadata: session.metadata,
  }

  const resolved = resolveCheckoutOrderId(sessionView)
  if (resolved !== orderId) {
    throw new PermanentPaymentError('orderId does not match Stripe session')
  }

  const orderRef = adminDb.collection('orders').doc(orderId)

  const outcome = await adminDb.runTransaction(async t => {
    const snap = await t.get(orderRef)
    if (!snap.exists) {
      throw new PermanentPaymentError(`Order ${orderId} does not exist`)
    }
    const data = snap.data() ?? {}

    if (data.status === 'paid') {
      return { alreadyPaid: true as const, data }
    }

    const guard = assertArtificialPaidSession(
      sessionView,
      {
        orderType: String(data.orderType ?? ''),
        sku: String(data.sku ?? ''),
        expectedAmountCents: Number(data.expectedAmountCents),
        expectedCurrency: String(data.expectedCurrency ?? ''),
        stripeSessionId: data.stripeSessionId ? String(data.stripeSessionId) : null,
      },
      orderId,
    )
    if (!guard.ok) {
      throw new PermanentPaymentError(guard.error)
    }

    t.update(orderRef, {
      status: 'paid',
      stripeEventId: event.id,
      stripeSessionId: data.stripeSessionId || session.id,
      stripePaymentIntent: session.payment_intent ?? null,
      stripeAmountTotal: session.amount_total ?? null,
      stripeCurrency: session.currency ?? null,
      paidAt: FieldValue.serverTimestamp(),
    })

    const payload = orderEmailPayloadFromDocument(data as Record<string, unknown>)
    enqueueOutboxInTransaction(
      t,
      id => adminDb.collection(EMAIL_OUTBOX_COLLECTION).doc(id),
      plannedOutboxEntries(orderId, payload, 'paid'),
      payload,
    )

    return { alreadyPaid: false as const, data }
  })

  const payload = orderEmailPayloadFromDocument(outcome.data as Record<string, unknown>)
  const flush = await flushEmailOutbox(adminDb, orderId, payload)

  await orderRef.update({
    merchantEmailStatus: flush.failed.includes('merchant_paid') ? 'pending_retry' : 'sent',
  }).catch(err => {
    console.error(`[Webhook][${event.id}] Failed to stamp merchantEmailStatus:`, err)
  })

  if (flush.failed.length > 0) {
    throw new Error(`Email outbox flush failed: ${flush.failed.join(',')}`)
  }
}
