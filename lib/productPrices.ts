// ── Product catalog + NN 101/2026 anchor prices ────────────────
//
// CURRENT selling prices are the amounts charged on the website today.
// ANCHOR prices are the independently verified retail prices on 2026-09-10.
// Anchor values are immutable historical facts — never derive them from current prices.
//
// Checkout/Stripe/OrderForm keep their own charge constants so payment
// behaviour cannot regress if this catalog is edited. Keep those files in
// numeric sync (see scripts/verify-price-compliance.ts).

export const ANCHOR_PRICE_DATE = '2026-09-10'
export const ANCHOR_PRICE_LABEL = 'Cijena na dan 10.9.2026.'
export const COMPLIANCE_EFFECTIVE_DATE = '2026-10-01'

export const BRAND_NAME = 'Luroni Cvijeće'

export const STANDARD_BOUQUETS = {
  S: {
    id:        'S' as const,
    code:      'LUR-BUK-S',
    name:      'Buket S',
    currentEur: 35,
    anchorEur:  35,
  },
  M: {
    id:        'M' as const,
    code:      'LUR-BUK-M',
    name:      'Buket M',
    currentEur: 45,
    anchorEur:  45,
  },
  L: {
    id:        'L' as const,
    code:      'LUR-BUK-L',
    name:      'Buket L',
    currentEur: 60,
    anchorEur:  60,
  },
} as const

export type StandardBouquetId = keyof typeof STANDARD_BOUQUETS

export const CUSTOM_BOUQUET = {
  codePrefix:     'LUR-BUK-CUSTOM',
  name:           'Buket po želji',
  currentMinEur:  70,
  currentMaxEur:  200,
  currentStepEur: 10,
  // Same selectable range existed on 2026-09-10 — do not collapse to a single €70 anchor.
  anchorMinEur:   70,
  anchorMaxEur:   200,
  anchorStepEur:  10,
} as const

export function zagrebCalendarDate(now = new Date()): string {
  return new Intl.DateTimeFormat('sv', {
    timeZone: 'Europe/Zagreb',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(now)
}

export function isAnchorPriceDisplayActive(now = new Date()): boolean {
  return zagrebCalendarDate(now) >= COMPLIANCE_EFFECTIVE_DATE
}

export function formatEuro(amount: number): string {
  return `${amount} €`
}

export function formatEuroRange(min: number, max: number): string {
  return `${min}–${max} €`
}

export function anchorPriceLine(amount: number): string {
  return `${ANCHOR_PRICE_LABEL}: ${formatEuro(amount)}`
}

export function anchorRangeLine(min: number, max: number): string {
  return `${ANCHOR_PRICE_LABEL}: ${formatEuroRange(min, max)}`
}

export function orderFormUnselectedAnchorLine(): string {
  return (
    `Cijene na dan 10.9.2026.: ` +
    `S ${STANDARD_BOUQUETS.S.anchorEur} € · ` +
    `M ${STANDARD_BOUQUETS.M.anchorEur} € · ` +
    `L ${STANDARD_BOUQUETS.L.anchorEur} € · ` +
    `po želji ${CUSTOM_BOUQUET.anchorMinEur}–${CUSTOM_BOUQUET.anchorMaxEur} €`
  )
}

export function customSelectableAmounts(
  min = CUSTOM_BOUQUET.currentMinEur,
  max = CUSTOM_BOUQUET.currentMaxEur,
  step = CUSTOM_BOUQUET.currentStepEur,
): number[] {
  const amounts: number[] = []
  for (let value = min; value <= max; value += step) amounts.push(value)
  return amounts
}

export function customAnchorAmounts(): number[] {
  return customSelectableAmounts(
    CUSTOM_BOUQUET.anchorMinEur,
    CUSTOM_BOUQUET.anchorMaxEur,
    CUSTOM_BOUQUET.anchorStepEur,
  )
}

export function customVariantCode(amount: number): string {
  return `${CUSTOM_BOUQUET.codePrefix}-${String(amount).padStart(3, '0')}`
}
