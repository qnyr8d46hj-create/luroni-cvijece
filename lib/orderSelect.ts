import { CUSTOM_BOUQUET } from '@/lib/productPrices'

export const ORDER_BOUQUET_PARAM = 'buket'
export const ORDER_BUDGET_PARAM = 'budzet'
export const ORDER_BOUQUET_CUSTOM = 'zelja'

export type StandardOrderBouquet = 'S' | 'M' | 'L'
export type OrderBouquetParam = StandardOrderBouquet | typeof ORDER_BOUQUET_CUSTOM

const STANDARD_SIZES = new Set<string>(['S', 'M', 'L'])

export function isValidCustomBudget(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= CUSTOM_BOUQUET.currentMinEur &&
    value <= CUSTOM_BOUQUET.currentMaxEur &&
    value % CUSTOM_BOUQUET.currentStepEur === 0
  )
}

export function orderSelectHref(
  orderHref: string,
  bouquet: OrderBouquetParam,
  budget?: number,
): string {
  const hashIndex = orderHref.indexOf('#')
  const hash = hashIndex >= 0 ? orderHref.slice(hashIndex) : '#order'
  const path = (hashIndex >= 0 ? orderHref.slice(0, hashIndex) : orderHref).split('?')[0]
  const params = new URLSearchParams()
  params.set(ORDER_BOUQUET_PARAM, bouquet)
  if (bouquet === ORDER_BOUQUET_CUSTOM && typeof budget === 'number') {
    params.set(ORDER_BUDGET_PARAM, String(budget))
  }
  return `${path}?${params.toString()}${hash}`
}

export function parseOrderSelectSearch(search: string): {
  size: string
  budget?: number
} | null {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  )
  const bouquet = params.get(ORDER_BOUQUET_PARAM)
  if (bouquet && STANDARD_SIZES.has(bouquet)) {
    return { size: bouquet }
  }
  if (bouquet === ORDER_BOUQUET_CUSTOM) {
    const rawBudget = params.get(ORDER_BUDGET_PARAM)
    const budget = rawBudget ? Number(rawBudget) : undefined
    if (typeof budget === 'number' && isValidCustomBudget(budget)) {
      return { size: CUSTOM_BOUQUET.name, budget }
    }
    return { size: CUSTOM_BOUQUET.name }
  }
  return null
}
