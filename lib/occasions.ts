export const OCCASION_PRODUCT_ID = 'Prigoda'

export interface OccasionBudgetOption {
  amount: number
  recommended?: boolean
  /** Optional personality label, currently used by Oprosti mi. */
  label?: string
}

export interface Occasion {
  id: string
  title: string
  description: string
  image: string
  alt: string
  order: number
  /** Allowed budgets in EUR. Test prices — change here only. */
  budgets: OccasionBudgetOption[]
}

function budgetOptions(
  amounts: [number, number, number],
  labels?: [string, string, string],
): OccasionBudgetOption[] {
  return amounts.map((amount, index) => ({
    amount,
    recommended: index === 1,
    ...(labels ? { label: labels[index] } : {}),
  }))
}

/**
 * Homepage occasion cards and their allowed budgets.
 * Copy, images and test prices can be swapped here without touching
 * Stripe SKUs or the traditional S/M/L product identifiers.
 */
export const OCCASIONS: Occasion[] = [
  {
    id: 'rodendan',
    title: 'Rođendan',
    description: 'Neka se osjećaju posebno.',
    image: '/images/slozeni-buketi/buket-7.jpg',
    alt: 'Šareni buket s ružičastim gerberama, prikladan za rođendanski dar',
    order: 1,
    budgets: budgetOptions([49, 69, 89]),
  },
  {
    id: 'ljubav-godisnjica',
    title: 'Ljubav & godišnjica',
    description: 'Za trenutke kada želite reći više.',
    image: '/images/slozeni-buketi/buket-5.jpg',
    alt: 'Raskošni buket božura u ružičastim i crvenim tonovima',
    order: 2,
    budgets: budgetOptions([59, 79, 99]),
  },
  {
    id: 'oprosti-mi',
    title: 'Oprosti mi',
    description: 'Ponekad riječi nisu dovoljne.',
    image: '/images/slozeni-buketi/buket-16.jpg',
    alt: 'Nježan buket s bijelim ljiljanom i pastelnim cvijećem',
    order: 3,
    budgets: budgetOptions(
      [59, 79, 109],
      ['Malo sam zeznuo', 'Ozbiljno sam zeznuo', 'Nemoj pitati'],
    ),
  },
  {
    id: 'rodenje-bebe',
    title: 'Rođenje bebe',
    description: 'Nježna dobrodošlica za novi život.',
    image: '/images/slozeni-buketi/buket-4.jpg',
    alt: 'Pastelni buket u plavom papiru, nježnih ružičastih i bijelih tonova',
    order: 4,
    budgets: budgetOptions([55, 75, 95]),
  },
  {
    id: 'luroni-signature',
    title: 'Luroni Signature',
    description:
      'Za sve ostale trenutke. Recite nam prigodu i prepustite ostalo našem floristu.',
    image: '/images/slozeni-buketi/buket-1.jpg',
    alt: 'Ručno složen Luroni buket s breskvasto-ružičastim ružama i crvenim bobicama',
    order: 5,
    budgets: budgetOptions([49, 69, 99]),
  },
]

export function getOccasionById(id: string): Occasion | undefined {
  return OCCASIONS.find((occasion) => occasion.id === id)
}

export function getOccasionBudgetOption(
  occasionId: string,
  amount: number,
): OccasionBudgetOption | undefined {
  return getOccasionById(occasionId)?.budgets.find((option) => option.amount === amount)
}

/**
 * Server-side pricing authority for occasion orders.
 * Returns the validated integer EUR amount, or null if the pair is not allowed.
 */
export function getValidOccasionBudget(
  occasionId: unknown,
  budget: unknown,
): number | null {
  if (typeof occasionId !== 'string') return null
  const occasion = getOccasionById(occasionId)
  if (!occasion) return null

  const amount =
    typeof budget === 'number'
      ? budget
      : typeof budget === 'string' && /^-?\d+$/.test(budget)
        ? Number(budget)
        : NaN

  if (!Number.isInteger(amount)) return null
  return occasion.budgets.some((option) => option.amount === amount) ? amount : null
}
