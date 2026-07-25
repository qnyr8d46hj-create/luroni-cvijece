// ── Temporary ordering restriction ─────────────────────────────
//
// HOW TO REMOVE: delete this file, remove the import from
//   app/api/create-checkout-session/route.ts
//   app/api/send-order-email/route.ts
//   app/api/order-status/route.ts
// and revert the OrderForm UI changes (blockNotice state + notice block).
//
// HOW TO CHANGE THE DATE: update BLOCKED_DATE below (YYYY-MM-DD, Europe/Zagreb).
// Set it to '' to disable without deleting the file.
//
// The restriction is self-expiring: isOrderingBlocked() returns false
// on any date that does not exactly match BLOCKED_DATE.

const BLOCKED_DATE = '2026-07-26'

export const ORDER_BLOCK_NOTICE =
  'U nedjelju 26.7. ne vršimo dostavu. Naručivanje je ponovno dostupno od ponedjeljka 27.7.'

// Returns true only when the current wall-clock date in Europe/Zagreb
// matches BLOCKED_DATE exactly. Uses Intl (Node 18+, available on Vercel).
export function isOrderingBlocked(): boolean {
  if (!BLOCKED_DATE) return false

  // 'sv' locale formats as YYYY-MM-DD — same shape as BLOCKED_DATE
  const todayZagreb = new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Zagreb',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(new Date())

  return todayZagreb === BLOCKED_DATE
}
