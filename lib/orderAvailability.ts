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

// Temporary delivery-slot restriction for 29–30 Aug 2026.
// Saturday 2026-08-29: only 08:00–12:00 (value "08-12") is available.
// Sunday 2026-08-30: no delivery. Next slot is Monday 2026-08-31.
const SATURDAY_LIMITED     = '2026-08-29'
const SUNDAY_UNAVAILABLE   = '2026-08-30'
const SATURDAY_ALLOWED_SLOT = '08-12'

export const WEEKEND_DELIVERY_NOTICE =
  'Prvi idući termin dostave dostupan je od ponedjeljka ujutro.'

export function isSundayUnavailable(date: string): boolean {
  return date === SUNDAY_UNAVAILABLE
}

export function isSaturdayAfternoonUnavailable(date: string, time: string): boolean {
  return date === SATURDAY_LIMITED && time !== SATURDAY_ALLOWED_SLOT
}

/** Returns the weekend notice if the chosen delivery date/time is unavailable. */
export function getUnavailableDeliveryMessage(
  deliveryDate: string,
  deliveryTime: string,
): string | null {
  if (!deliveryDate) return null
  if (isSundayUnavailable(deliveryDate)) return WEEKEND_DELIVERY_NOTICE
  if (isSaturdayAfternoonUnavailable(deliveryDate, deliveryTime)) {
    return WEEKEND_DELIVERY_NOTICE
  }
  return null
}

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
