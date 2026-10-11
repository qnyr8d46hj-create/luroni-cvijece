/** Convert a positive EUR amount to Stripe integer cents without trusting floats blindly. */
export function euroToCents(priceEur: number): number | null {
  if (typeof priceEur !== 'number' || !Number.isFinite(priceEur) || priceEur <= 0) {
    return null
  }
  const scaled = priceEur * 100
  const cents = Math.round(scaled)
  if (cents < 1) return null
  if (Math.abs(scaled - cents) > 1e-8) return null
  return cents
}
