import { NextResponse }                          from 'next/server'
import { sendOrderNotificationEmail }           from '@/lib/sendOrderEmail'
import type { OrderEmailPayload }               from '@/lib/sendOrderEmail'
import { isOrderingBlocked, ORDER_BLOCK_NOTICE } from '@/lib/orderAvailability'

// ── POST /api/send-order-email ─────────────────────────────────
// Called by OrderForm.tsx for cash payments immediately on form submit.
// Card payments go through the Stripe webhook instead, which calls
// sendOrderNotificationEmail() directly from lib/sendOrderEmail.ts.
export async function POST(request: Request): Promise<Response> {
  if (isOrderingBlocked()) {
    return NextResponse.json({ error: ORDER_BLOCK_NOTICE }, { status: 503 })
  }

  let order: OrderEmailPayload
  try {
    order = await request.json() as OrderEmailPayload
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = await sendOrderNotificationEmail(order)

  if (!result.success) {
    console.error('[send-order-email] Failed:', result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, messageId: result.messageId })
}
