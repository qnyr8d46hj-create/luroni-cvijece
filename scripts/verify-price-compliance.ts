import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CUSTOM_BOUQUET,
  STANDARD_BOUQUETS,
  anchorPriceLine,
  anchorRangeLine,
  customSelectableAmounts,
  isAnchorPriceDisplayActive,
} from '../lib/productPrices'
import { NN_PRICE_COMPLIANCE_ENABLED } from '../lib/nnPriceCompliance'
import { isValidCustomBudget, parseOrderSelectSearch } from '../lib/orderSelect'
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

assert(s.currentEur === 45 && s.anchorEur === 35, 'Buket S must be 45 current + 35 historical anchor')
assert(m.currentEur === 55 && m.anchorEur === 45, 'Buket M must be 55 current + 45 historical anchor')
assert(l.currentEur === 70 && l.anchorEur === 60, 'Buket L must be 70 current + 60 historical anchor')
assert(
  CUSTOM_BOUQUET.currentMinEur === 80 &&
    CUSTOM_BOUQUET.currentMaxEur === 200 &&
    CUSTOM_BOUQUET.currentStepEur === 10,
  'Custom current range must be 80–200 / 10',
)
assert(
  CUSTOM_BOUQUET.anchorMinEur === 70 &&
    CUSTOM_BOUQUET.anchorMaxEur === 200 &&
    CUSTOM_BOUQUET.anchorStepEur === 10,
  'Custom historical anchor range must remain 70–200 / 10',
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
assert(amounts.length === 13, 'Custom selectable amounts must be 13 values (80–200 / 10)')
assert(amounts[0] === 80 && amounts[12] === 200, 'Custom current range endpoints')
assert(!amounts.includes(70), '€70 is no longer a valid current custom budget')
assert(!isValidCustomBudget(70), 'Server/URL custom validation must reject €70')
assert(isValidCustomBudget(80) && isValidCustomBudget(100) && isValidCustomBudget(150) && isValidCustomBudget(200), 'Valid custom increments 80–200')

const invalidBudgetHandoff = parseOrderSelectSearch('?buket=zelja&budzet=70')
assert(invalidBudgetHandoff?.size === CUSTOM_BOUQUET.name, 'Invalid €70 URL still selects custom bouquet')
assert(invalidBudgetHandoff?.budget === undefined, 'Invalid €70 URL must not carry a budget (form falls back to €80)')
assert(parseOrderSelectSearch('?buket=zelja&budzet=80')?.budget === 80, 'Custom €80 URL handoff')
assert(parseOrderSelectSearch('?buket=zelja&budzet=100')?.budget === 100, 'Custom €100 URL handoff')
assert(parseOrderSelectSearch('?buket=zelja&budzet=150')?.budget === 150, 'Custom €150 URL handoff')
assert(parseOrderSelectSearch('?buket=zelja&budzet=200')?.budget === 200, 'Custom €200 URL handoff')
assert(parseOrderSelectSearch('?buket=S')?.size === 'S', 'S URL handoff')
assert(parseOrderSelectSearch('?buket=M')?.size === 'M', 'M URL handoff')
assert(parseOrderSelectSearch('?buket=L')?.size === 'L', 'L URL handoff')

const rows = buildPriceListRows()
assert(rows.length === 3 + 13, 'CSV must have 3 standard rows + 13 current custom variants')
assert(PRICE_LIST_COLUMNS.every(col => col in rows[0]), 'All required CSV columns present')

const sRow = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-S')
if (!sRow) fail('Missing Buket S CSV row')
assert(sRow.maloprodajna_cijena === '45.00' && sRow.sidrena_cijena === '35.00', 'Buket S CSV current vs historical anchor')
assert(sRow.barkod === '' && sRow.jedinica_mjere === '', 'Inapplicable fields stay empty')

const mRow = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-M')
if (!mRow) fail('Missing Buket M CSV row')
assert(mRow.maloprodajna_cijena === '55.00' && mRow.sidrena_cijena === '45.00', 'Buket M CSV current vs historical anchor')

const lRow = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-L')
if (!lRow) fail('Missing Buket L CSV row')
assert(lRow.maloprodajna_cijena === '70.00' && lRow.sidrena_cijena === '60.00', 'Buket L CSV current vs historical anchor')

assert(
  !rows.some(row => row.sifra_proizvoda === 'LUR-BUK-CUSTOM-070'),
  'Current CSV must not offer retired custom €70 variant',
)
const custom80 = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-CUSTOM-080')
if (!custom80) fail('Missing custom 80 CSV row')
assert(custom80.maloprodajna_cijena === '80.00' && custom80.sidrena_cijena === '80.00', 'Custom 80 CSV')
const custom200 = rows.find(row => row.sifra_proizvoda === 'LUR-BUK-CUSTOM-200')
if (!custom200) fail('Missing custom 200 CSV row')
assert(custom200.maloprodajna_cijena === '200.00' && custom200.sidrena_cijena === '200.00', 'Custom 200 CSV')

const csv = serializePriceListCsv(rows)
assert(csv.charCodeAt(0) === 0xfeff, 'CSV must start with UTF-8 BOM')
assert(csv.includes('naziv;sifra_proizvoda;marka'), 'CSV header is semicolon-delimited')
assert(!csv.includes('70–200'), 'CSV must not put a range in maloprodajna cijena')
assert(!csv.includes('80–200'), 'CSV must not put the current custom range in maloprodajna cijena')

assert(
  isAnchorPriceDisplayActive() === NN_PRICE_COMPLIANCE_ENABLED,
  'Anchor-price display must follow NN_PRICE_COMPLIANCE_ENABLED, not a calendar date',
)
assert(
  NN_PRICE_COMPLIANCE_ENABLED === false,
  'NN price compliance is currently expected to be disabled (deadline extended to 2026-11-17)',
)

const checkout = readFileSync(resolve(root, 'app/api/create-checkout-session/route.ts'), 'utf8')
assert(checkout.includes('S: 4500'), 'Stripe S amount is 45 EUR')
assert(checkout.includes('M: 5500'), 'Stripe M amount is 55 EUR')
assert(checkout.includes('L: 7000'), 'Stripe L amount is 70 EUR')
assert(checkout.includes('CUSTOM_BUDGET_MIN  = 80'), 'Stripe custom min is 80')
assert(checkout.includes('CUSTOM_BUDGET_MAX  = 200'), 'Stripe custom max is 200')
assert(checkout.includes('CUSTOM_BUDGET_STEP = 10'), 'Stripe custom step is 10')

const orderForm = readFileSync(resolve(root, 'app/components/OrderForm.tsx'), 'utf8')
assert(orderForm.includes('S: 45, M: 55, L: 70'), 'OrderForm charge map matches current catalog')
assert(orderForm.includes('CUSTOM_PRICE_MIN  = 80'), 'OrderForm custom min is 80')
assert(orderForm.includes("useState('')"), 'OrderForm default bouquet stays unselected')

const ga = readFileSync(resolve(root, 'app/api/get-checkout-session/route.ts'), 'utf8')
assert(ga.includes('S: 45, M: 55, L: 70'), 'GA4 fallback amounts match current catalog')

const customCard = readFileSync(resolve(root, 'app/components/CustomBouquetCard.tsx'), 'utf8')
assert(customCard.includes('CUSTOM_PRICE_MIN  = 80'), 'Homepage custom card min is 80')

assert(!checkout.includes('S: 3500'), 'Old Stripe S €35 mapping must be gone')
assert(!checkout.includes('CUSTOM_BUDGET_MIN  = 70'), 'Old Stripe custom €70 min must be gone')
assert(!orderForm.includes('S: 35, M: 45, L: 60'), 'Old OrderForm charge map must be gone')
assert(!orderForm.includes('Buket po želji — od 70'), 'Old OrderForm custom minimum label must be gone')

const bouquetTypes = readFileSync(resolve(root, 'lib/data.ts'), 'utf8')
assert(bouquetTypes.includes("id: 'L'") && bouquetTypes.includes('popular: true'), 'Najpopularniji is Buket L')
assert(
  /id: 'M'[\s\S]*?popular: false[\s\S]*?id: 'L'[\s\S]*?popular: true/.test(bouquetTypes),
  'Popular badge moved from M to L',
)

const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
  crons?: { path: string; schedule: string }[]
}
if (NN_PRICE_COMPLIANCE_ENABLED) {
  assert(
    vercel.crons?.some(
      (job) => job.path === '/api/cron/publish-price-list' && job.schedule === '0 5 * * *',
    ),
    'Enabled compliance requires the daily price-list cron in vercel.json',
  )
} else {
  assert(
    Array.isArray(vercel.crons) && vercel.crons.length === 0,
    'Disabled compliance must not register a Vercel cron',
  )
}

console.log(
  NN_PRICE_COMPLIANCE_ENABLED
    ? 'Price compliance checks passed (feature enabled).'
    : 'Price compliance checks passed (feature disabled; current catalog and Stripe updated, historical anchors unchanged).',
)
