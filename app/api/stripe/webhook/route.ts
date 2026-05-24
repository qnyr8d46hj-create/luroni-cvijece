import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ── Stripe client — server-side only ──────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

// ── POST /api/stripe/webhook ───────────────────────────────────
//
// Stripe delivers signed POST requests here for every subscribed event.
// We handle checkout.session.completed; all other types are acknowledged
// silently so Stripe never retries them.
//
// Safety contract
//   1. Signature verification  — rejects any payload not signed by Stripe.
//   2. Idempotency             — stripeEventId on the Firestore doc prevents
//                                double-processing when Stripe retries.
//   3. Existence guard         — missing document logs + returns 200 (no retry).
//   4. Email on paid           — card-payment confirmation email is sent from
//                                here, not from the form, so it only fires
//                                once the payment is actually confirmed.
//
// NOTE: Uses Firebase client SDK (@/lib/firebase), the same instance as the
// order form. Works as long as Firestore security rules allow unauthenticated
// writes to the orders collection. If you later tighten those rules, replace
// @/lib/firebase with the Firebase Admin SDK + a service-account credential.
export async function POST(req: NextRequest) {

  // ── 0. Log every incoming webhook immediately ─────────────
  console.log('[Webhook] POST /api/stripe/webhook — request received')

  // ── 1. Guard: env var must be present ─────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] FATAL: STRIPE_WEBHOOK_SECRET env var is not set — cannot verify signatures')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    )
  }

  // ── 2. Raw body — must reach constructEvent unmodified ────
  // Next.js App Router exposes the native Web API Request, so req.text()
  // returns the raw body string. Never use req.json() before this step —
  // JSON parsing changes whitespace and breaks the signature.
  const rawBody   = await req.text()
  const signature = req.headers.get('stripe-signature')

  console.log('[Webhook] stripe-signature header present:', !!signature)

  if (!signature) {
    console.error('[Webhook] Rejected: missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    )
  }

  // ── 3. Verify Stripe signature ─────────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    // Most common cause: wrong STRIPE_WEBHOOK_SECRET (CLI secret vs Dashboard secret).
    console.error('[Webhook] Signature verification FAILED — check STRIPE_WEBHOOK_SECRET matches the endpoint secret in Stripe Dashboard (or CLI output):', err)
    // 400 = rejected payload; Stripe will NOT retry on 4xx
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Webhook] Signature verified ✓ — event.id: ${event.id}, type: ${event.type}`)

  // ── 4. Dispatch on event type ──────────────────────────────
  try {
    switch (event.type) {

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event, req)
        break

      // Silently acknowledge unhandled types — prevents Stripe retrying them.
      default:
        console.log(`[Webhook] Unhandled event type "${event.type}" — acknowledged without action`)
        break
    }
  } catch (err) {
    // 500 causes Stripe to retry with exponential back-off.
    // Only reached for unexpected transient errors (Firestore down, etc.).
    console.error(`[Webhook] Handler threw for ${event.type} (${event.id}):`, err)
    return NextResponse.json(
      { error: 'Handler failed — will retry' },
      { status: 500 },
    )
  }

  // ── 5. Acknowledge receipt ─────────────────────────────────
  // Stripe requires a 2xx within 30 s or it schedules a retry.
  console.log(`[Webhook] Responding 200 for event ${event.id}`)
  return NextResponse.json({ received: true })
}

// ── checkout.session.completed ─────────────────────────────────
async function handleCheckoutCompleted(event: Stripe.Event, req: NextRequest) {
  const session = event.data.object as Stripe.Checkout.Session

  console.log(`[Webhook][${event.id}] Handling checkout.session.completed`)
  console.log(`[Webhook][${event.id}] Stripe session ID: ${session.id}`)
  console.log(`[Webhook][${event.id}] Payment status: ${session.payment_status}`)
  console.log(`[Webhook][${event.id}] Amount total: ${session.amount_total} ${session.currency}`)

  // ── Resolve the Firestore order ID ─────────────────────────
  // Prefer client_reference_id (set explicitly when creating the session).
  // Fall back to metadata.orderId as a secondary source.
  const orderId =
    session.client_reference_id ||
    (session.metadata?.orderId ?? null)

  console.log(`[Webhook][${event.id}] client_reference_id: ${session.client_reference_id ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] metadata.orderId: ${session.metadata?.orderId ?? '(null)'}`)
  console.log(`[Webhook][${event.id}] Resolved order ID: ${orderId ?? '(none)'}`)

  if (!orderId) {
    console.error(
      `[Webhook][${event.id}] MISSING order ID — neither client_reference_id nor metadata.orderId is set on session ${session.id}. ` +
      'This session was not created by this app or the checkout session was not configured correctly.',
    )
    // Return cleanly — Stripe should not retry a session with no order ID.
    return
  }

  // ── Fetch the Firestore order ──────────────────────────────
  console.log(`[Webhook][${event.id}] Fetching Firestore order: orders/${orderId}`)
  const orderRef  = doc(db, 'orders', orderId)
  let   orderSnap

  try {
    orderSnap = await getDoc(orderRef)
  } catch (err) {
    console.error(`[Webhook][${event.id}] Firestore getDoc FAILED for orders/${orderId}:`, err)
    throw err  // Re-throw → 500 → Stripe retries
  }

  if (!orderSnap.exists()) {
    console.error(
      `[Webhook][${event.id}] Firestore document orders/${orderId} does NOT exist. ` +
      'Possible causes: Firestore write failed before Stripe redirect, or orderId is wrong.',
    )
    return  // No retry — the document genuinely doesn't exist
  }

  const orderData = orderSnap.data()
  console.log(`[Webhook][${event.id}] Firestore order found — current status: "${orderData.status}"`)

  // ── Idempotency guard ──────────────────────────────────────
  // Stripe guarantees at-least-once delivery; the same event may arrive
  // multiple times. If we already stored this event ID, skip silently.
  if (orderData.stripeEventId === event.id) {
    console.log(`[Webhook][${event.id}] Already processed (stripeEventId matches) — skipping`)
    return
  }

  // ── Mark order as paid ─────────────────────────────────────
  console.log(`[Webhook][${event.id}] Updating Firestore order to status "paid"...`)

  try {
    await updateDoc(orderRef, {
      status:              'paid',
      stripeEventId:       event.id,          // idempotency key
      stripeSessionId:     session.id,
      stripePaymentIntent: session.payment_intent ?? null,
      stripeAmountTotal:   session.amount_total   ?? null,  // cents
      stripeCurrency:      session.currency       ?? null,
      paidAt:              new Date().toISOString(),
    })
    console.log(`[Webhook][${event.id}] ✓ Firestore order orders/${orderId} updated to "paid"`)
  } catch (err) {
    console.error(`[Webhook][${event.id}] Firestore updateDoc FAILED for orders/${orderId}:`, err)
    throw err  // Re-throw → 500 → Stripe retries
  }

  // ── Send order notification email ──────────────────────────
  // For card payments: email is deferred until here (payment confirmed).
  // For cash payments: email is sent immediately from OrderForm.tsx.
  // Calling the existing /api/send-order-email route re-uses the full
  // HTML email template without duplicating it.
  console.log(`[Webhook][${event.id}] Sending order notification email...`)

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

  // Fire-and-forget — email failure must NOT cause the webhook to return 500
  // (that would make Stripe retry the payment confirmation handler).
  fetch(`${baseUrl}/api/send-order-email`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(emailPayload),
  })
    .then(r => {
      if (r.ok) {
        console.log(`[Webhook][${event.id}] ✓ Order notification email sent for orders/${orderId}`)
      } else {
        console.error(`[Webhook][${event.id}] Email API returned HTTP ${r.status} for orders/${orderId}`)
      }
    })
    .catch(err => {
      console.error(`[Webhook][${event.id}] Email notification fetch FAILED for orders/${orderId}:`, err)
    })
}
