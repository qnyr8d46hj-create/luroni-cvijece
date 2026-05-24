import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { adminDb, FieldValue } from '@/lib/firebaseAdmin'

// ── Stripe client — server-side only ──────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ── POST /api/stripe/webhook ───────────────────────────────────
//
// Receives signed Stripe events. Uses Firebase Admin SDK for Firestore so
// the server-side connection works correctly on Vercel (the client SDK
// cannot maintain a WebSocket in a stateless serverless function and throws
// "client is offline" — the Admin SDK uses HTTPS REST and has no such issue).
//
// Safety contract
//   1. Signature verification  — rejects anything not signed by Stripe.
//   2. Idempotency             — stripeEventId on the order doc prevents
//                                double-processing on Stripe retries.
//   3. Existence guard         — missing document logs + returns 200.
//   4. Email after paid        — notification email is sent here, not at
//                                checkout redirect, so it only fires once
//                                actual payment is confirmed.
export async function POST(req: NextRequest) {

  // ── 0. Log every incoming delivery immediately ────────────
  console.log('[Webhook] POST /api/stripe/webhook received')

  // ── 1. Guard: env vars present ────────────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] FATAL: STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // ── 2. Raw body — must arrive unmodified at constructEvent ─
  // req.text() gives the raw string via the native Web API Request.
  // NEVER call req.json() before this — it mutates whitespace and
  // permanently breaks the HMAC signature check.
  const rawBody   = await req.text()
  const signature = req.headers.get('stripe-signature')

  console.log('[Webhook] stripe-signature present:', !!signature)

  if (!signature) {
    console.error('[Webhook] Rejected: missing stripe-signature header')
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // ── 3. Verify Stripe signature ─────────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    // Most common cause: STRIPE_WEBHOOK_SECRET doesn't match the endpoint.
    // Local dev: use the whsec_ printed by `stripe listen`, not the Dashboard secret.
    console.error(
      '[Webhook] Signature verification FAILED — ' +
      'STRIPE_WEBHOOK_SECRET must match the secret shown by `stripe listen` (local) ' +
      'or the Stripe Dashboard endpoint (production):',
      err,
    )
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Webhook] ✓ Signature verified — id: ${event.id}  type: ${event.type}`)

  // ── 4. Dispatch ────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, req)
        break
      default:
        console.log(`[Webhook] Unhandled type "${event.type}" — acknowledged silently`)
    }
  } catch (err) {
    // 500 → Stripe retries with exponential back-off. Only thrown for
    // transient failures (Firestore unavailable, etc.).
    console.error(`[Webhook] Handler error for ${event.type} (${event.id}):`, err)
    return NextResponse.json({ error: 'Handler failed — will retry' }, { status: 500 })
  }

  // ── 5. Acknowledge ─────────────────────────────────────────
  console.log(`[Webhook] 200 OK for event ${event.id}`)
  return NextResponse.json({ received: true })
}

// ── Handler: checkout.session.completed ───────────────────────
async function handleCheckoutCompleted(event: Stripe.Event, req: NextRequest) {
  const session = event.data.object as Stripe.Checkout.Session

  console.log(`[Webhook][${event.id}] checkout.session.completed`)
  console.log(`[Webhook][${event.id}] session.id:              ${session.id}`)
  console.log(`[Webhook][${event.id}] session.payment_status:  ${session.payment_status}`)
  console.log(`[Webhook][${event.id}] session.amount_total:    ${session.amount_total} ${session.currency}`)
  console.log(`[Webhook][${event.id}] session.payment_intent:  ${session.payment_intent ?? '(null)'}`)

  // ── Resolve order ID ───────────────────────────────────────
  // client_reference_id is set explicitly in create-checkout-session.
  // metadata.orderId is a belt-and-suspenders backup.
  const orderId =
    session.client_reference_id ||
    session.metadata?.orderId   ||
    null

  console.log(`[Webhook][${event.id}] client_reference_id: ${session.client_reference_id ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] metadata.orderId:    ${session.metadata?.orderId   ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] Resolved orderId:    ${orderId ?? '(none — cannot update Firestore)'}`)

  if (!orderId) {
    console.error(
      `[Webhook][${event.id}] No order ID found on session ${session.id}. ` +
      'Session was not created through the order form, or client_reference_id was not set.',
    )
    return
  }

  // ── Fetch order via Admin SDK ──────────────────────────────
  // Admin SDK uses HTTPS REST internally — works correctly in stateless
  // serverless functions on Vercel. The client SDK uses a persistent
  // WebSocket that cannot survive cold-start isolation, causing the
  // "client is offline" error that triggered this migration.
  console.log(`[Webhook][${event.id}] Fetching Firestore orders/${orderId} via Admin SDK...`)
  const orderRef = adminDb.collection('orders').doc(orderId)
  let orderSnap: FirebaseFirestore.DocumentSnapshot

  try {
    orderSnap = await orderRef.get()
  } catch (err) {
    console.error(`[Webhook][${event.id}] Admin SDK getDoc FAILED for orders/${orderId}:`, err)
    throw err // → 500 → Stripe retries
  }

  // Admin SDK: .exists is a boolean property, not a method
  if (!orderSnap.exists) {
    console.error(
      `[Webhook][${event.id}] orders/${orderId} does not exist in Firestore. ` +
      'The Firestore write in OrderForm may have failed before the Stripe redirect.',
    )
    return // Don't retry — the doc genuinely doesn't exist
  }

  const orderData = orderSnap.data()!
  console.log(`[Webhook][${event.id}] Order found — current status: "${orderData.status}"`)

  // ── Idempotency ────────────────────────────────────────────
  if (orderData.stripeEventId === event.id) {
    console.log(`[Webhook][${event.id}] Already processed (stripeEventId matches) — skipping`)
    return
  }

  // ── Update Firestore ───────────────────────────────────────
  console.log(`[Webhook][${event.id}] Updating orders/${orderId} → status: "paid"...`)

  try {
    await orderRef.update({
      status:              'paid',
      stripeEventId:       event.id,                       // idempotency key
      stripeSessionId:     session.id,
      stripePaymentIntent: session.payment_intent ?? null,
      stripeAmountTotal:   session.amount_total   ?? null, // cents
      stripeCurrency:      session.currency       ?? null,
      paidAt:              FieldValue.serverTimestamp(),   // server-side timestamp
    })
    console.log(`[Webhook][${event.id}] ✓ orders/${orderId} updated to "paid"`)
  } catch (err) {
    console.error(`[Webhook][${event.id}] Admin SDK update FAILED for orders/${orderId}:`, err)
    throw err // → 500 → Stripe retries
  }

  // ── Send notification email ────────────────────────────────
  // Card payments: email deferred until payment is confirmed here.
  // Cash payments: email sent immediately from OrderForm.tsx (unchanged).
  // Re-uses /api/send-order-email so the HTML template is not duplicated.
  console.log(`[Webhook][${event.id}] Dispatching notification email for orders/${orderId}...`)

  const proto   = req.headers.get('x-forwarded-proto') ?? 'http'
  const host    = req.headers.get('host')              ?? 'localhost:3000'
  const baseUrl = `${proto}://${host}`

  const emailPayload = {
    fullName:        String(orderData.fullName        ?? ''),
    phone:           String(orderData.phone           ?? ''),
    email:           String(orderData.email           ?? ''),
    deliveryAddress: String(orderData.deliveryAddress ?? ''),
    deliveryCity:    String(orderData.deliveryCity    ?? ''),
    bouquetSize:     String(orderData.bouquetSize     ?? ''),
    bouquetPrice:    orderData.bouquetPrice            ?? null,
    deliveryDate:    String(orderData.deliveryDate    ?? ''),
    deliveryTime:    String(orderData.deliveryTime    ?? ''),
    cardMessage:     String(orderData.cardMessage     ?? ''),
    paymentMethod:   String(orderData.paymentMethod   ?? 'card'),
  }

  // Fire-and-forget — email failure must NOT return 500 (would cause Stripe
  // to retry and double-update the order).
  fetch(`${baseUrl}/api/send-order-email`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(emailPayload),
  })
    .then(r => {
      if (r.ok) {
        console.log(`[Webhook][${event.id}] ✓ Email sent for orders/${orderId}`)
      } else {
        console.error(`[Webhook][${event.id}] Email API returned HTTP ${r.status} for orders/${orderId}`)
      }
    })
    .catch(err => {
      console.error(`[Webhook][${event.id}] Email fetch failed for orders/${orderId}:`, err)
    })
}
