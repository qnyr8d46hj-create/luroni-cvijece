import { NextRequest, NextResponse } from 'next/server'
import { ARTIFICIAL_ORDER_TYPE } from '@/lib/artificialBouquetPaths'
import {
  flushEmailOutbox,
  isArtificialEmailRetryAuthorized,
  orderEmailPayloadFromDocument,
} from '@/lib/orderEmailOutbox'

export async function POST(req: NextRequest) {
  const authorized = isArtificialEmailRetryAuthorized(
    req.headers.get('authorization'),
    {
      retry: process.env.EMAIL_RETRY_SECRET,
      cron: process.env.CRON_SECRET,
    },
  )
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { orderId?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
  }

  const { adminDb } = await import('@/lib/firebaseAdmin')
  const orderRef = adminDb.collection('orders').doc(orderId)
  const snap = await orderRef.get()
  if (!snap.exists) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  const data = snap.data() ?? {}
  if (data.orderType !== ARTIFICIAL_ORDER_TYPE) {
    return NextResponse.json({ error: 'Not an artificial order' }, { status: 400 })
  }

  const payload = orderEmailPayloadFromDocument(data as Record<string, unknown>)
  const flush = await flushEmailOutbox(adminDb, orderId, payload)

  await orderRef.update({
    merchantEmailStatus: flush.failed.some(item => item.startsWith('merchant'))
      ? 'pending_retry'
      : 'sent',
  })

  return NextResponse.json({
    success: flush.failed.length === 0,
    sent: flush.sent,
    skipped: flush.skipped,
    failed: flush.failed,
  })
}
