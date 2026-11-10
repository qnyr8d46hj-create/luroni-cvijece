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
  applyFreshPayment,
  formatFreshPaymentReview,
  freshMerchantEmailFromOrder,
  freshMerchantEmailOutcome,
  type FreshMerchantEmail,
} from '@/lib/freshCheckout'
import type { OrderEmailPayload } from '@/lib/sendOrderEmail'

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

  const orderId = resolveCheckoutOrderId({
    id: session.id,
    payment_status: session.payment_status,
    currency: session.currency ?? null,
    amount_total: session.amount_total ?? null,
    client_reference_id: session.client_reference_id,
    metadata: session.metadata,
  })

  if (!orderId) {
    const referenceId = (session.client_reference_id ?? '').trim()
    const metadataId = (session.metadata?.orderId ?? '').trim()
    console.error(
      `[Webhook][MANUAL_REVIEW_REFUND] session=${session.id} ` +
      `payment_intent=${paymentIntentId(session.payment_intent) ?? ''} ` +
      `amount_total=${session.amount_total ?? ''} currency=${session.currency ?? ''} ` +
      `client_reference_id=${referenceId} metadata_order_id=${metadataId} ` +
      'reason=orderId does not match Stripe session',
    )
    throw new PermanentPaymentError('orderId does not match Stripe session')
  }

  const orderRef = adminDb.collection('orders').doc(orderId)
  const orderSnap = await orderRef.get()
  if (!orderSnap.exists) {
    console.error(
      `[Webhook][MANUAL_REVIEW_REFUND] order=${orderId} session=${session.id} ` +
      `amount_total=${session.amount_total ?? ''} currency=${session.currency ?? ''} ` +
      'reason=Order document does not exist',
    )
    throw new PermanentPaymentError(`Order ${orderId} does not exist`)
  }

  const orderData = (orderSnap.data() ?? {}) as Record<string, unknown>
  if (orderData.orderType === ARTIFICIAL_ORDER_TYPE) {
    await completeArtificialPaidOrder(event, session, orderId)
    return
  }

  await completeFreshPaidOrder(event, session, orderId)
}

function paymentIntentId(
  value: Stripe.Checkout.Session['payment_intent'],
): string | null {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id
  return null
}

function asOrderEmail(email: FreshMerchantEmail): OrderEmailPayload {
  return { ...email, orderType: 'fresh' }
}

async function finishFreshMerchantEmail(
  orderId: string,
  email: FreshMerchantEmail | null,
  eventId: string,
  decision: 'mark_paid' | 'already_paid',
) {
  const outboxRef = adminDb.collection(EMAIL_OUTBOX_COLLECTION).doc(`${orderId}_merchant_paid`)
  const existing = await outboxRef.get()
  if (!existing.exists) {
    if (decision === 'already_paid') {
      console.log(`[Webhook][${eventId}] Fresh order ${orderId} is already paid and has no email outbox`)
      return
    }
    throw new Error(`Fresh merchant email outbox is missing for ${orderId}`)
  }

  if (!email) {
    throw new Error(`Fresh merchant email payload is missing for ${orderId}`)
  }

  const flush = await flushEmailOutbox(adminDb, orderId, asOrderEmail(email))
  const after = await outboxRef.get()
  const status = after.data()?.status
  const outcome = freshMerchantEmailOutcome({
    outboxExists: after.exists,
    outboxStatus: typeof status === 'string' ? status : null,
    flushFailed: flush.failed.includes('merchant_paid'),
  })
  if (outcome === 'retry') {
    throw new Error(`Fresh merchant email not delivered for ${orderId}`)
  }

  await adminDb.collection('orders').doc(orderId).update({
    merchantEmailStatus: 'sent',
  }).catch(err => {
    console.error(`[Webhook][${eventId}] Failed to stamp merchantEmailStatus:`, err)
  })
}

async function completeFreshPaidOrder(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  orderId: string,
) {
  const orderRef = adminDb.collection('orders').doc(orderId)
  const sessionView = {
    id: session.id,
    payment_status: session.payment_status,
    currency: session.currency ?? null,
    amount_total: session.amount_total ?? null,
    client_reference_id: session.client_reference_id,
    metadata: session.metadata,
    payment_intent: paymentIntentId(session.payment_intent),
  }

  const decision = await adminDb.runTransaction(async t => {
    const snap = await t.get(orderRef)
    const current = snap.exists ? (snap.data() ?? {}) as Record<string, unknown> : null
    const result = applyFreshPayment(current, {
      orderId,
      eventId: event.id,
      session: sessionView,
      recordedAt: new Date().toISOString(),
    })

    if (result.action === 'mark_paid') {
      t.update(orderRef, {
        ...result.update,
        paidAt: FieldValue.serverTimestamp(),
      })
      const payload = asOrderEmail(result.email)
      enqueueOutboxInTransaction(
        t,
        id => adminDb.collection(EMAIL_OUTBOX_COLLECTION).doc(id),
        plannedOutboxEntries(orderId, payload, 'paid'),
        payload,
      )
    } else if (result.action === 'reject') {
      t.update(orderRef, { paymentReview: result.review })
      console.error(formatFreshPaymentReview(result.review))
    }

    return result
  })

  if (decision.action === 'missing') {
    console.error(
      `[Webhook][MANUAL_REVIEW_REFUND] order=${orderId} session=${session.id} ` +
      `payment_intent=${sessionView.payment_intent ?? ''} amount_total=${session.amount_total ?? ''} ` +
      'reason=Order document does not exist',
    )
    throw new PermanentPaymentError(`Order ${orderId} does not exist`)
  }
  if (decision.action === 'reject') {
    throw new PermanentPaymentError(decision.reason)
  }

  const email = decision.action === 'mark_paid'
    ? decision.email
    : freshMerchantEmailFromOrder(decision.order)
  await finishFreshMerchantEmail(orderId, email, event.id, decision.action)
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
