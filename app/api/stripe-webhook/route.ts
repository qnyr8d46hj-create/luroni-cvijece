import { NextResponse } from 'next/server'

// ── DEPRECATED — wrong path ────────────────────────────────────
//
// This file was the original webhook handler but is at the wrong URL.
// The live handler is now at:  app/api/stripe/webhook/route.ts
//                    URL:      /api/stripe/webhook
//
// Configure Stripe Dashboard / CLI to call /api/stripe/webhook.
// This file can be deleted once you have verified the new route is working.
//
export async function POST() {
  console.error(
    '[Webhook] Request hit DEPRECATED /api/stripe-webhook — ' +
    'update your Stripe endpoint URL to /api/stripe/webhook',
  )
  return NextResponse.json(
    { error: 'Endpoint moved to /api/stripe/webhook' },
    { status: 410 }, // 410 Gone
  )
}
