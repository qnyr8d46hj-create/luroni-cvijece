import { NextResponse }                          from 'next/server'
import { sendOrderNotificationEmail }           from '@/lib/sendOrderEmail'
import type { OrderEmailPayload }               from '@/lib/sendOrderEmail'
import { isOrderingBlocked, ORDER_BLOCK_NOTICE, getUnavailableDeliveryMessage } from '@/lib/orderAvailability'
import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// ── POST /api/send-order-email ─────────────────────────────────
// Fresh-bouquet cash payments only.
// Artificial orders must be created by POST /api/create-artificial-order.
export async function POST(request: Request): Promise<Response> {
  if (isOrderingBlocked()) {
    return NextResponse.json({ error: ORDER_BLOCK_NOTICE }, { status: 503 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (asString(body.orderType) === ARTIFICIAL_ORDER_TYPE || asString(body.sku).startsWith('UM-')) {
    return NextResponse.json(
      { error: 'Artificial orders must be created through /api/create-artificial-order' },
      { status: 400 },
    )
  }

  const order = body as unknown as OrderEmailPayload

  const slotError = getUnavailableDeliveryMessage(
    String(order.deliveryDate ?? ''),
    String(order.deliveryTime ?? ''),
  )
  if (slotError) {
    return NextResponse.json({ error: slotError }, { status: 400 })
  }

  const result = await sendOrderNotificationEmail(order)

  if (!result.success) {
    console.error('[send-order-email] Failed:', result.error)
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, messageId: result.messageId })
}
