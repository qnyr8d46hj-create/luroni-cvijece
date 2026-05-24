import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, FieldValue }            from '@/lib/firebaseAdmin'
import { sendOrderNotificationEmail }     from '@/lib/sendOrderEmail'
import type { OrderEmailPayload }         from '@/lib/sendOrderEmail'

// ── Stripe client — server-side only ──────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ── POST /api/stripe/webhook ───────────────────────────────────
export async function POST(req: NextRequest) {

  console.log('[Webhook] POST /api/stripe/webhook received')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] FATAL: STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Raw body must reach constructEvent completely unmodified.
  // Never call req.json() before this line.
  const rawBody   = await req.text()
  const signature = req.headers.get('stripe-signature')

  console.log('[Webhook] stripe-signature header present:', !!signature)

  if (!signature) {
    console.error('[Webhook] Rejected: missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error(
      '[Webhook] Signature verification FAILED. ' +
      'Check that STRIPE_WEBHOOK_SECRET matches the Stripe Dashboard endpoint secret ' +
      '(or the whsec_ printed by `stripe listen` for local dev):',
      err,
    )
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Webhook] ✓ Signature OK — event.id: ${event.id}  type: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event)
        break
      default:
        console.log(`[Webhook] Unhandled event type "${event.type}" — acknowledged silently`)
    }
  } catch (err) {
    // 500 → Stripe retries. Only thrown for transient Firestore failures.
    console.error(`[Webhook] Handler threw for ${event.type} (${event.id}):`, err)
    return NextResponse.json({ error: 'Handler failed — will retry' }, { status: 500 })
  }

  console.log(`[Webhook] Returning 200 for event ${event.id}`)
  return NextResponse.json({ received: true })
}

// ── checkout.session.completed ─────────────────────────────────
//
// Execution order (strict — each step must succeed before the next):
//   1.  Validate payment_status === 'paid'
//   2.  Resolve and validate orderId
//   3.  Fetch Firestore document
//   4.  Idempotency guard
//   5.  Build and log update payload
//   6.  Write update via Admin SDK
//   7.  Re-read document to verify write persisted
//   8.  Send notification email (only after confirmed write)
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session

  // ── Step 1: Log every field from the session ───────────────
  console.log(`[Webhook][${event.id}] ═══ checkout.session.completed ═══`)
  console.log(`[Webhook][${event.id}] event.id:                    ${event.id}`)
  console.log(`[Webhook][${event.id}] session.id:                  ${session.id}`)
  console.log(`[Webhook][${event.id}] session.payment_status:      ${session.payment_status}`)
  console.log(`[Webhook][${event.id}] session.client_reference_id: ${session.client_reference_id ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] session.metadata.orderId:    ${session.metadata?.orderId ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] session.payment_intent:      ${session.payment_intent  ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] session.amount_total:        ${session.amount_total} ${session.currency}`)

  // ── Step 2: Gate on payment_status ─────────────────────────
  // For card payments this is always 'paid'. Defend against edge cases
  // (bank transfers, test events) where it might be 'unpaid'.
  if (session.payment_status !== 'paid') {
    console.warn(
      `[Webhook][${event.id}] payment_status is "${session.payment_status}" — ` +
      'expected "paid". Skipping Firestore update and email.',
    )
    return
  }

  // ── Step 3: Resolve orderId ────────────────────────────────
  // Primary: client_reference_id (set explicitly in create-checkout-session).
  // Fallback: metadata.orderId (belt-and-suspenders).
  const orderId =
    (session.client_reference_id ?? '').trim() ||
    (session.metadata?.orderId   ?? '').trim() ||
    null

  console.log(`[Webhook][${event.id}] Resolved orderId: ${orderId ?? '(NONE)'}`)

  if (!orderId) {
    console.error(
      `[Webhook][${event.id}] Cannot resolve orderId from session ${session.id}. ` +
      'client_reference_id and metadata.orderId are both empty. ' +
      'Verify that create-checkout-session sets client_reference_id = Firestore doc ID.',
    )
    return // Return 200 — Stripe should not retry a structurally broken session
  }

  // ── Step 4: Log exact Firestore path ───────────────────────
  const firestorePath = `orders/${orderId}`
  console.log(`[Webhook][${event.id}] Firestore document path: ${firestorePath}`)

  // ── Step 5: Fetch the order document ───────────────────────
  console.log(`[Webhook][${event.id}] Fetching document...`)
  const orderRef = adminDb.collection('orders').doc(orderId)
  let orderSnap: FirebaseFirestore.DocumentSnapshot

  try {
    orderSnap = await orderRef.get()
  } catch (err) {
    console.error(`[Webhook][${event.id}] Admin SDK get() FAILED for ${firestorePath}:`, err)
    throw err // → 500 → Stripe retries
  }

  if (!orderSnap.exists) {
    console.error(
      `[Webhook][${event.id}] Document ${firestorePath} does NOT exist. ` +
      'The Firestore write in OrderForm.tsx may have failed before the Stripe redirect, ' +
      'or the orderId in client_reference_id does not match the actual document ID.',
    )
    return
  }

  const orderData = orderSnap.data()!
  console.log(`[Webhook][${event.id}] Document found — status BEFORE update: "${orderData.status}"`)
  console.log(`[Webhook][${event.id}] Existing stripeEventId: "${orderData.stripeEventId ?? '(null)'}"`)

  // ── Step 6: Idempotency guard ──────────────────────────────
  if (orderData.stripeEventId === event.id) {
    console.log(
      `[Webhook][${event.id}] This event was already processed (stripeEventId matches). ` +
      'Skipping update and email to prevent double-processing.',
    )
    return
  }

  // ── Step 7: Build and log the update payload ───────────────
  const updatePayload = {
    status:              'paid',
    stripeEventId:       event.id,
    stripeSessionId:     session.id,
    stripePaymentIntent: session.payment_intent ?? null,
    stripeAmountTotal:   session.amount_total   ?? null,
    stripeCurrency:      session.currency       ?? null,
    paidAt:              FieldValue.serverTimestamp(),
  }

  // Log the payload (stringify paidAt since it's a Firestore sentinel object)
  console.log(`[Webhook][${event.id}] Update payload:`, JSON.stringify({
    ...updatePayload,
    paidAt: '[FieldValue.serverTimestamp()]',
  }))

  // ── Step 8: Write update via Admin SDK ─────────────────────
  console.log(`[Webhook][${event.id}] Calling orderRef.update()...`)

  try {
    const writeResult = await orderRef.update(updatePayload)
    console.log(
      `[Webhook][${event.id}] orderRef.update() resolved — ` +
      `writeTime: ${writeResult.writeTime.toDate().toISOString()}`,
    )
  } catch (err) {
    console.error(
      `[Webhook][${event.id}] Admin SDK update() FAILED for ${firestorePath}:`,
      err,
    )
    throw err // → 500 → Stripe retries the delivery
  }

  // ── Step 9: Re-read document to verify the write persisted ─
  // This is the definitive check. If status is still "pending_payment" here,
  // the Admin SDK write is not reaching Firestore despite returning success.
  console.log(`[Webhook][${event.id}] Re-reading ${firestorePath} to verify write...`)

  try {
    const verifySnap   = await orderRef.get()
    const statusAfter  = verifySnap.data()?.status  ?? '(field missing)'
    const paidAtAfter  = verifySnap.data()?.paidAt  ?? '(field missing)'

    console.log(`[Webhook][${event.id}] ── POST-UPDATE VERIFICATION ──`)
    console.log(`[Webhook][${event.id}] status after update:  "${statusAfter}"`)
    console.log(`[Webhook][${event.id}] paidAt after update:  ${paidAtAfter}`)

    if (statusAfter !== 'paid') {
      console.error(
        `[Webhook][${event.id}] !! WRITE DID NOT PERSIST !! ` +
        `status is "${statusAfter}" instead of "paid" after a successful update() call. ` +
        'Possible causes: wrong Firestore project, wrong database, or Admin SDK credential mismatch.',
      )
    } else {
      console.log(`[Webhook][${event.id}] ✓ Write confirmed — status is "paid"`)
    }
  } catch (err) {
    // Verification failure is logged but does not affect the 200 response —
    // the update() itself already succeeded and we don't want Stripe to retry.
    console.error(`[Webhook][${event.id}] Verification re-read failed:`, err)
  }

  // ── Step 10: Send notification email ──────────────────────
  // Runs strictly AFTER the Firestore update and verification.
  // Email failure never causes a 500 — Stripe must not retry the payment update.
  const toEmail = process.env.ORDER_NOTIFICATION_EMAIL ?? '(ORDER_NOTIFICATION_EMAIL not set)'
  console.log(`[Webhook][${event.id}] Sending notification email to: ${toEmail}`)

  const emailPayload: OrderEmailPayload = {
    fullName:        String(orderData.fullName        ?? ''),
    phone:           String(orderData.phone           ?? ''),
    email:           String(orderData.email           ?? ''),
    deliveryAddress: String(orderData.deliveryAddress ?? ''),
    deliveryCity:    String(orderData.deliveryCity    ?? ''),
    bouquetSize:     String(orderData.bouquetSize     ?? ''),
    bouquetPrice:    typeof orderData.bouquetPrice === 'number' ? orderData.bouquetPrice : null,
    deliveryDate:    String(orderData.deliveryDate    ?? ''),
    deliveryTime:    String(orderData.deliveryTime    ?? ''),
    cardMessage:     String(orderData.cardMessage     ?? ''),
    paymentMethod:   String(orderData.paymentMethod   ?? 'card'),
  }

  try {
    const emailResult = await sendOrderNotificationEmail(emailPayload)

    if (emailResult.success) {
      console.log(
        `[Webhook][${event.id}] ✓ Email sent — ` +
        `Resend messageId: ${emailResult.messageId ?? '(none)'} — ` +
        `recipient: ${toEmail}`,
      )
    } else {
      console.error(
        `[Webhook][${event.id}] Email FAILED — Resend error: ${emailResult.error} — ` +
        `recipient: ${toEmail}`,
      )
    }
  } catch (err) {
    console.error(`[Webhook][${event.id}] Email threw unexpectedly:`, err)
  }

  console.log(`[Webhook][${event.id}] ═══ handler complete ═══`)
}
