// ── Product catalog + NN 101/2026 anchor prices ────────────────
//
// CURRENT selling prices are the amounts charged on the website today.
// ANCHOR prices are the independently verified retail prices on 2026-09-10.
// Anchor values are immutable historical facts — never derive them from current prices.
//
// Checkout/Stripe/OrderForm keep their own charge constants so payment
// behaviour cannot regress if this catalog is edited. Keep those files in
// numeric sync (see scripts/verify-price-compliance.ts).

import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'

export const ANCHOR_PRICE_DATE = '2026-09-10'
export const ANCHOR_PRICE_LABEL = 'Cijena na dan 10.9.2026.'
/** Original NN 101/2026 start date. Display is gated by the feature flag, not by either date. */
export const COMPLIANCE_EFFECTIVE_DATE = '2026-10-01'
/** Date in NN 110/2026 and NN 59/2026. The flag stays off past this date until approval. */
export const COMPLIANCE_APPLICABLE_DATE = '2026-11-17'

export const BRAND_NAME = 'Luroni Cvijeće'

/** Assembled per order from seasonal flowers. Not a legal stock status. */
export const FRESH_BOUQUET_SUPPLY = 'made-to-order' as const

export const STANDARD_BOUQUETS = {
  S: {
    id:        'S' as const,
    code:      'LUR-BUK-S',
    name:      'Buket S',
    currentEur: 45,
    anchorEur:  35,
  },
  M: {
    id:        'M' as const,
    code:      'LUR-BUK-M',
    name:      'Buket M',
    currentEur: 55,
    anchorEur:  45,
  },
  L: {
    id:        'L' as const,
    code:      'LUR-BUK-L',
    name:      'Buket L',
    currentEur: 70,
    anchorEur:  60,
  },
} as const

export type StandardBouquetId = keyof typeof STANDARD_BOUQUETS

export const CUSTOM_BOUQUET = {
  codePrefix:     'LUR-BUK-CUSTOM',
  name:           'Buket po želji',
  currentMinEur:  80,
  currentMaxEur:  200,
  currentStepEur: 10,
  // On 2026-09-10 the selectable budgets were 70–200 in steps of 10.
  // The €70 step was withdrawn on 2026-09-29. Every budget still sold
  // (80, 90, … 200) had that same price on 2026-09-10. Do not replace
  // those per-step prices with the retired €70 minimum.
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
  void now
  return NN_PRICE_COMPLIANCE_ENABLED
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
  const custom = currentCustomAnchorRange()
  return (
    `Cijene na dan 10.9.2026.: ` +
    `S ${STANDARD_BOUQUETS.S.anchorEur} € · ` +
    `M ${STANDARD_BOUQUETS.M.anchorEur} € · ` +
    `L ${STANDARD_BOUQUETS.L.anchorEur} € · ` +
    `po želji ${custom.min}–${custom.max} €`
  )
}

export function customSelectableAmounts(
  min: number = CUSTOM_BOUQUET.currentMinEur,
  max: number = CUSTOM_BOUQUET.currentMaxEur,
  step: number = CUSTOM_BOUQUET.currentStepEur,
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

/** 10 September price of a budget that is still sold. Null for the retired €70 step. */
export function referenceEuroForCustomBudget(amount: number): number | null {
  const anchors = new Set(customAnchorAmounts())
  return customSelectableAmounts().includes(amount) && anchors.has(amount) ? amount : null
}

/** Customer-facing reference line for one selected budget. Null when that step has no verified 10 September price. */
export function customBudgetReferenceLine(amount: number): string | null {
  const reference = referenceEuroForCustomBudget(amount)
  return reference == null ? null : anchorPriceLine(reference)
}

/** Reference range of the budgets a customer can still choose. Excludes retired €70. */
export function currentCustomAnchorRange(): { min: number; max: number } {
  const offered = customSelectableAmounts().filter(amount => referenceEuroForCustomBudget(amount) != null)
  const min = offered[0]
  const max = offered[offered.length - 1]
  if (min == null || max == null) {
    throw new Error('No custom budget still has a 2026-09-10 reference price')
  }
  return { min, max }
}

export function customVariantCode(amount: number): string {
  return `${CUSTOM_BOUQUET.codePrefix}-${String(amount).padStart(3, '0')}`
}
