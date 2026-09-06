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

// ── Temporary delivery-date restrictions (Sep 2026) ────────────
//
// Exact calendar dates only — not day-of-week logic.
// Delivery dates are YYYY-MM-DD strings from the date picker (Zagreb local calendar).
// After these dates pass, scheduling returns to normal with no further change.
//
// HOW TO REMOVE: delete this section and switch OrderForm back to unrestricted
// date/time handling (imports of getUnavailableDeliveryMessage, notices, and
// slot disabling). Server routes already call getUnavailableDeliveryMessage.

const BLOCKED_DELIVERY_DATES: Record<string, string> = {
  '2026-09-07':
    'Za ponedjeljak 7.9. ne primamo narudžbe. Dostava je ponovno moguća u utorak 8.9. od 16 h.',
  '2026-09-12':
    'Za subotu 12.9. ne primamo narudžbe. Dostava je ponovno moguća od ponedjeljka 14.9.',
}

const LIMITED_DELIVERY_DATES: Record<string, { allowedSlot: string; notice: string }> = {
  '2026-09-08': {
    allowedSlot: '16-20',
    notice:      'U utorak 8.9. dostava je moguća od 16 do 20 h.',
  },
}

export function isDeliveryDateBlocked(date: string): boolean {
  return Boolean(BLOCKED_DELIVERY_DATES[date])
}

/** Informational notice for the selected delivery date, if restricted. */
export function getDeliveryRestrictionNotice(date: string): string | null {
  if (!date) return null
  if (BLOCKED_DELIVERY_DATES[date]) return BLOCKED_DELIVERY_DATES[date]
  if (LIMITED_DELIVERY_DATES[date]) return LIMITED_DELIVERY_DATES[date].notice
  return null
}

/** Returns a validation message if the chosen delivery date/time is unavailable. */
export function getUnavailableDeliveryMessage(
  deliveryDate: string,
  deliveryTime: string,
): string | null {
  if (!deliveryDate) return null
  if (BLOCKED_DELIVERY_DATES[deliveryDate]) {
    return BLOCKED_DELIVERY_DATES[deliveryDate]
  }
  const limited = LIMITED_DELIVERY_DATES[deliveryDate]
  if (limited && deliveryTime !== limited.allowedSlot) {
    return limited.notice
  }
  return null
}

/** True when this time-slot option must be hidden/disabled for the given date. */
export function isDeliveryTimeOptionDisabled(date: string, slot: string): boolean {
  return getUnavailableDeliveryMessage(date, slot) !== null
}

/** Clear a time that is invalid for the newly selected (still-orderable) date. */
export function coerceDeliveryTime(date: string, time: string): string {
  if (!date || isDeliveryDateBlocked(date)) return time
  if (getUnavailableDeliveryMessage(date, time)) return ''
  return time
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
