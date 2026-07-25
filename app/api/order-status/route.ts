import { NextResponse }                          from 'next/server'
import { isOrderingBlocked, ORDER_BLOCK_NOTICE } from '@/lib/orderAvailability'

// ── GET /api/order-status ──────────────────────────────────────
// Returns whether ordering is currently available, based on the
// server's wall-clock date in Europe/Zagreb.
// Called by OrderForm on mount to drive the disabled-button UI.
export async function GET() {
  const blocked = isOrderingBlocked()
  return NextResponse.json({
    available: !blocked,
    notice:    blocked ? ORDER_BLOCK_NOTICE : null,
  })
}
