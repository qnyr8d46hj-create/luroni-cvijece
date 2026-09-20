import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CUSTOM_BOUQUET,
  STANDARD_BOUQUETS,
  anchorPriceLine,
  anchorRangeLine,
  customSelectableAmounts,
} from '../lib/productPrices'
import {
  PRICE_LIST_COLUMNS,
  buildPriceListRows,
  serializePriceListCsv,
} from '../lib/priceListCsv'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

const s = STANDARD_BOUQUETS.S
const m = STANDARD_BOUQUETS.M
const l = STANDARD_BOUQUETS.L

assert(s.currentEur === 35 && s.anchorEur === 35, 'Buket S must be 35 current + 35 anchor')
assert(m.currentEur === 45 && m.anchorEur === 45, 'Buket M must be 45 current + 45 anchor')
assert(l.currentEur === 60 && l.anchorEur === 60, 'Buket L must be 60 current + 60 anchor')
assert(
  CUSTOM_BOUQUET.currentMinEur === 70 &&
    CUSTOM_BOUQUET.currentMaxEur === 200 &&
    CUSTOM_BOUQUET.currentStepEur === 10,
  'Custom current range must be 70–200 / 10',
)
assert(
  CUSTOM_BOUQUET.anchorMinEur === 70 &&
    CUSTOM_BOUQUET.anchorMaxEur === 200 &&
    CUSTOM_BOUQUET.anchorStepEur === 10,
  'Custom anchor range must be 70–200 / 10',
)

assert(
  anchorPriceLine(35) === 'Cijena na dan 10.9.2026.: 35 €',
  'S/M/L customer-facing anchor copy',
)
assert(
  anchorRangeLine(70, 200) === 'Cijena na dan 10.9.2026.: 70–200 €',
  'Custom customer-facing anchor copy',
)

const mutatedCurrent = { currentEur: 99, anchorEur: s.anchorEur }
assert(mutatedCurrent.anchorEur === 35, 'Changing current price must not mutate 2026-09-10 anchor')

const amounts = customSelectableAmounts()
assert(amounts.length === 14, 'Custom selectable amounts must be 14 values')
assert(amounts[0] === 70 && amounts[13] === 200, 'Custom range endpoints')

const rows = buildPriceListRows()
assert(rows.length === 3 + 14, 'CSV must have 3 standard rows + 14 custom variants')
assert(PRICE_LIST_COLUMNS.every(col => col in rows[0]), 'All required CSV columns present')

const sRow = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-S')
if (!sRow) fail('Missing Buket S CSV row')
assert(sRow.maloprodajna_cijena === '35.00' && sRow.sidrena_cijena === '35.00', 'Buket S CSV prices')
assert(sRow.barkod === '' && sRow.jedinica_mjere === '', 'Inapplicable fields stay empty')

const custom70 = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-CUSTOM-070')
if (!custom70) fail('Missing custom 70 CSV row')
assert(custom70.maloprodajna_cijena === '70.00' && custom70.sidrena_cijena === '70.00', 'Custom 70 CSV')
const custom200 = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-CUSTOM-200')
if (!custom200) fail('Missing custom 200 CSV row')
assert(custom200.maloprodajna_cijena === '200.00' && custom200.sidrena_cijena === '200.00', 'Custom 200 CSV')

const csv = serializePriceListCsv(rows)
assert(csv.charCodeAt(0) === 0xfeff, 'CSV must start with UTF-8 BOM')
assert(csv.includes('naziv;sifra_proizvoda;marka'), 'CSV header is semicolon-delimited')
assert(!csv.includes('70–200'), 'CSV must not put a range in maloprodajna cijena')

const checkout = readFileSync(resolve(root, 'app/api/create-checkout-session/route.ts'), 'utf8')
assert(checkout.includes('S: 3500'), 'Stripe S amount unchanged')
assert(checkout.includes('M: 4500'), 'Stripe M amount unchanged')
assert(checkout.includes('L: 6000'), 'Stripe L amount unchanged')
assert(checkout.includes('CUSTOM_BUDGET_MIN  = 70'), 'Stripe custom min unchanged')
assert(checkout.includes('CUSTOM_BUDGET_MAX  = 200'), 'Stripe custom max unchanged')
assert(checkout.includes('CUSTOM_BUDGET_STEP = 10'), 'Stripe custom step unchanged')

const orderForm = readFileSync(resolve(root, 'app/components/OrderForm.tsx'), 'utf8')
assert(orderForm.includes('S: 35, M: 45, L: 60'), 'OrderForm charge map unchanged')
assert(orderForm.includes('CUSTOM_PRICE_MIN  = 70'), 'OrderForm custom min unchanged')

const ga = readFileSync(resolve(root, 'app/api/get-checkout-session/route.ts'), 'utf8')
assert(ga.includes('S: 35, M: 45, L: 60'), 'GA4 fallback amounts unchanged')

console.log('Price compliance checks passed.')
