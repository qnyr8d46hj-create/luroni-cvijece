import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseArtificialBouquet, isPurchasableArtificialBouquet } from '../lib/artificialBouquets'
import { isArtificialCheckoutEnabled } from '../lib/artificialCheckoutEnabled'
import {
  parseArtificialOrderRequest,
  rejectedClientTrustFields,
} from '../lib/artificialOrderRequest'
import { buildTrustedArtificialOrder } from '../lib/trustedArtificialOrder'
import {
  assertArtificialPaidSession,
  canBindStripeSession,
  resolveCheckoutOrderId,
} from '../lib/artificialPaymentGuard'
import {
  canClaimOutbox,
  customerEmailDeliveryEnabled,
  isArtificialEmailRetryAuthorized,
  plannedOutboxEntries,
} from '../lib/orderEmailOutbox'
import { euroToCents } from '../lib/euroCents'
import { orderEmailFromAddress } from '../lib/resendFrom'
import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '../lib/artificialArrangementsPublic'
import { ARTIFICIAL_ORDER_TYPE } from '../lib/artificialBouquetPaths'
import type { OrderEmailPayload } from '../lib/sendOrderEmail'
import { ga4PurchaseFromCheckoutSession } from '../lib/ga4Purchase'
import { NN_PRICE_COMPLIANCE_ENABLED } from '../lib/nnPriceCompliance'
import { DELIVERY_CITIES } from '../lib/deliveryLocations'

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}
function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

const validBody = {
  sku: 'UM-001',
  paymentMethod: 'card',
  fullName: 'Ana Horvat',
  phone: '+385 91 234 5678',
  email: 'ana@email.com',
  deliveryAddress: 'Ulica 1',
  deliveryCity: 'Rijeka',
  deliveryDate: '2099-01-15',
  deliveryTime: '16-20',
  cardMessage: 'Hvala',
  productPrice: 1,
  productName: 'Hacked',
  status: 'paid',
  orderId: 'someone-elses-order',
  stripeSessionId: 'cs_hack',
}

const parsed = parseArtificialOrderRequest(validBody)
assert(parsed.ok, 'Valid delivery + SKU is accepted')
if (parsed.ok) {
  assert(parsed.data.sku === 'UM-001', 'SKU comes from request')
  assert(!('productPrice' in parsed.data), 'Client price is not parsed')
  assert(!('status' in parsed.data), 'Client status is not parsed')
  assert(!('orderId' in parsed.data), 'Client orderId is not parsed')
}
assert(
  rejectedClientTrustFields(validBody).includes('productPrice'),
  'Forged price is listed as an ignored trust field',
)

assert(!parseArtificialOrderRequest({ ...validBody, sku: 'S' }).ok, 'Fresh size S is rejected as SKU')
assert(!parseArtificialOrderRequest({ ...validBody, sku: 'UM-999-BAD' }).ok, 'Malformed SKU is rejected')
assert(!parseArtificialOrderRequest({ ...validBody, deliveryCity: 'Zagreb' }).ok, 'Unknown city is rejected')
assert(!parseArtificialOrderRequest({ ...validBody, paymentMethod: 'crypto' }).ok, 'Unknown payment method is rejected')

const product = parseArtificialBouquet('UM-001', {
  name: 'Aranžman 1',
  priceEur: 40,
  available: true,
  active: true,
  sortOrder: 1,
})
assert('product' in product, 'Fixture product parses')
if ('product' in product && parsed.ok) {
  const trusted = buildTrustedArtificialOrder(parsed.data, product.product)
  assert(!('error' in trusted), 'Trusted order builds')
  if (!('error' in trusted)) {
    assert(trusted.productPrice === 40, 'Server price is 40 not client 1')
    assert(trusted.productName === 'Aranžman 1', 'Server name is not client Hacked')
    assert(trusted.status === 'pending_payment', 'Card status is pending_payment not paid')
    assert(trusted.expectedAmountCents === 4000, 'Locked amount is 4000 cents')
    assert(trusted.expectedCurrency === 'eur', 'Locked currency is eur')
    assert(trusted.stripeSessionId === null, 'No Stripe session until server binds one')
    assert(trusted.quantity === 1, 'Quantity is 1')
    assert(trusted.createdBy === 'server', 'createdBy is server')
  }
}

const inactive = parseArtificialBouquet('UM-002', {
  name: 'Aranžman 2',
  priceEur: 50,
  available: true,
  active: false,
  sortOrder: 2,
})
assert('product' in inactive && !isPurchasableArtificialBouquet(inactive.product), 'Inactive SKU is not purchasable')
const unavailable = parseArtificialBouquet('UM-003', {
  name: 'Aranžman 3',
  priceEur: 60,
  available: false,
  active: true,
  sortOrder: 3,
})
assert('product' in unavailable && !isPurchasableArtificialBouquet(unavailable.product), 'Unavailable SKU is not purchasable')

const locked = {
  orderType: ARTIFICIAL_ORDER_TYPE,
  sku: 'UM-001',
  expectedAmountCents: 4000,
  expectedCurrency: 'eur',
  stripeSessionId: 'cs_bound',
}
const paidSession = {
  id: 'cs_bound',
  payment_status: 'paid',
  currency: 'eur',
  amount_total: 4000,
  client_reference_id: 'order-1',
  metadata: { orderId: 'order-1', orderType: ARTIFICIAL_ORDER_TYPE, sku: 'UM-001' },
}
assert(assertArtificialPaidSession(paidSession, locked, 'order-1').ok, 'Matching paid session is accepted')
assert(
  !assertArtificialPaidSession({ ...paidSession, amount_total: 100 }, locked, 'order-1').ok,
  'Mismatched amount is rejected even if catalog later changes',
)
assert(
  !assertArtificialPaidSession(
    { ...paidSession, metadata: { ...paidSession.metadata, sku: 'UM-017' } },
    locked,
    'order-1',
  ).ok,
  'Mismatched SKU is rejected',
)
assert(
  !assertArtificialPaidSession({ ...paidSession, id: 'cs_other' }, locked, 'order-1').ok,
  'Mismatched session ID is rejected',
)
assert(
  !assertArtificialPaidSession({ ...paidSession, currency: 'usd' }, locked, 'order-1').ok,
  'Non-EUR currency is rejected',
)
assert(
  !assertArtificialPaidSession({ ...paidSession, payment_status: 'unpaid' }, locked, 'order-1').ok,
  'Unpaid session is rejected',
)
assert(
  resolveCheckoutOrderId({
    ...paidSession,
    client_reference_id: 'order-1',
    metadata: { ...paidSession.metadata, orderId: 'order-2' },
  }) === null,
  'Conflicting order ids are rejected',
)

assert(canBindStripeSession(null, 'cs_1'), 'First session can bind')
assert(canBindStripeSession('cs_1', 'cs_1'), 'Same session can rebind')
assert(!canBindStripeSession('cs_1', 'cs_2'), 'Second competing session cannot bind')

const laterCatalogPrice = euroToCents(60)
assert(laterCatalogPrice === 6000, 'Later catalog price would be 60 EUR')
assert(
  !assertArtificialPaidSession(
    { ...paidSession, amount_total: laterCatalogPrice },
    locked,
    'order-1',
  ).ok,
  'Webhook uses locked checkout amount, not a later catalog price',
)

const cashPayload: OrderEmailPayload = {
  fullName: 'Ana Horvat',
  phone: '+385 91 234 5678',
  email: 'ana@email.com',
  deliveryAddress: 'Ulica 1',
  deliveryCity: 'Rijeka',
  bouquetSize: '',
  bouquetPrice: 40,
  deliveryDate: '2099-01-15',
  deliveryTime: '16-20',
  cardMessage: '',
  paymentMethod: 'cash',
  orderType: 'artificial',
  sku: 'UM-001',
  productName: 'Aranžman 1',
  productPrice: 40,
}
const cashOutbox = plannedOutboxEntries('ord1', cashPayload, 'cash')
assert(cashOutbox.some(e => e.purpose === 'merchant_cash' && e.status === 'pending'), 'Cash merchant email is queued')
assert(
  cashOutbox.some(e => e.purpose === 'customer_cash' && e.status === 'skipped') || customerEmailDeliveryEnabled(),
  'Customer cash email is skipped until the sending domain is verified',
)

const paidOutbox = plannedOutboxEntries('ord1', { ...cashPayload, paymentMethod: 'card' }, 'paid')
assert(paidOutbox[0]?.idempotencyKey === 'ord1_merchant_paid', 'Paid merchant outbox id is deterministic')
const paidOutboxAgain = plannedOutboxEntries('ord1', { ...cashPayload, paymentMethod: 'card' }, 'paid')
assert(
  paidOutbox[0]?.idempotencyKey === paidOutboxAgain[0]?.idempotencyKey,
  'Repeated webhook uses the same email idempotency key',
)

assert(orderEmailFromAddress().includes('onboarding@resend.dev') || customerEmailDeliveryEnabled(), 'Unverified domain keeps the sandbox sender')
assert(canClaimOutbox({ status: 'pending' }, 1000), 'Pending outbox can be claimed')
assert(!canClaimOutbox({ status: 'sent' }, 1000), 'Sent outbox cannot be claimed again')
assert(!canClaimOutbox({ status: 'sending', leaseUntil: 2000 }, 1000), 'Leased outbox cannot be claimed by a second worker')
assert(canClaimOutbox({ status: 'sending', leaseUntil: 500 }, 1000), 'Expired lease can be retried')
assert(
  !isArtificialEmailRetryAuthorized('Bearer no', { retry: 'secret', cron: 'cron' }),
  'Wrong retry secret is rejected',
)
assert(
  isArtificialEmailRetryAuthorized('Bearer secret', { retry: 'secret' }),
  'Matching retry secret is accepted',
)

const previousFlag = process.env.ARTIFICIAL_CHECKOUT_ENABLED
delete process.env.ARTIFICIAL_CHECKOUT_ENABLED
assert(!isArtificialCheckoutEnabled(), 'Unset ARTIFICIAL_CHECKOUT_ENABLED disables checkout')
process.env.ARTIFICIAL_CHECKOUT_ENABLED = 'false'
assert(!isArtificialCheckoutEnabled(), '"false" disables checkout')
process.env.ARTIFICIAL_CHECKOUT_ENABLED = 'TRUE'
assert(!isArtificialCheckoutEnabled(), 'Only lowercase true enables checkout')
process.env.ARTIFICIAL_CHECKOUT_ENABLED = 'true'
assert(isArtificialCheckoutEnabled(), '"true" enables checkout')
if (previousFlag === undefined) delete process.env.ARTIFICIAL_CHECKOUT_ENABLED
else process.env.ARTIFICIAL_CHECKOUT_ENABLED = previousFlag

assert(ARTIFICIAL_ARRANGEMENTS_PUBLIC === false, 'Artificial catalog is temporarily hidden')

const root = process.cwd()
const createArtificialRoute = readFileSync(resolve(root, 'app/api/create-artificial-order/route.ts'), 'utf8')
assert(
  createArtificialRoute.includes('if (!ARTIFICIAL_ARRANGEMENTS_PUBLIC)'),
  'Artificial order API rejects requests when the catalog is hidden',
)
assert(
  createArtificialRoute.indexOf('if (!ARTIFICIAL_ARRANGEMENTS_PUBLIC)') <
    createArtificialRoute.indexOf('if (!isArtificialCheckoutEnabled())'),
  'Catalog hide is checked before ARTIFICIAL_CHECKOUT_ENABLED',
)
assert(
  createArtificialRoute.includes('if (!isArtificialCheckoutEnabled())'),
  'Artificial order API rejects requests when checkout is disabled',
)
const catalogPage = readFileSync(resolve(root, 'app/umjetni-cvjetni-aranzmani/page.tsx'), 'utf8')
assert(catalogPage.includes('notFound()'), 'Catalog page returns 404 while hidden')
assert(
  catalogPage.includes('checkoutEnabled={isArtificialCheckoutEnabled()}'),
  'Catalog cards receive the server-side checkout flag',
)
const orderPage = readFileSync(resolve(root, 'app/umjetni-cvjetni-aranzmani/narudzba/page.tsx'), 'utf8')
assert(orderPage.includes('notFound()'), 'Order page returns 404 while hidden')
const homepage = readFileSync(resolve(root, 'app/page.tsx'), 'utf8')
assert(
  homepage.includes('ARTIFICIAL_ARRANGEMENTS_PUBLIC && <ArtificialCatalogTeaser />'),
  'Homepage teaser is gated by the public flag',
)
const footer = readFileSync(resolve(root, 'app/components/Footer.tsx'), 'utf8')
assert(footer.includes('ARTIFICIAL_ARRANGEMENTS_PUBLIC'), 'Footer link is gated by the public flag')
const sitemap = readFileSync(resolve(root, 'app/sitemap.ts'), 'utf8')
assert(sitemap.includes('ARTIFICIAL_ARRANGEMENTS_PUBLIC'), 'Sitemap omits the catalog unless public')
assert(
  sitemap.includes('ARTIFICIAL_BOUQUET_PAGE_PATH'),
  'Sitemap keeps the catalog URL in source for restore',
)
const cardSource = readFileSync(resolve(root, 'app/components/ArtificialProductCard.tsx'), 'utf8')
assert(
  cardSource.includes('product.available && checkoutEnabled'),
  'Purchase links require checkoutEnabled',
)
const checkoutSessionRoute = readFileSync(resolve(root, 'app/api/create-checkout-session/route.ts'), 'utf8')
assert(
  checkoutSessionRoute.includes("body.orderType === ARTIFICIAL_ORDER_TYPE"),
  'Fresh Stripe route still rejects artificial orderType',
)
assert(
  checkoutSessionRoute.includes('S: 4500') && checkoutSessionRoute.includes('M: 5500') && checkoutSessionRoute.includes('L: 7000'),
  'Fresh Stripe amounts are unchanged',
)

assert(NN_PRICE_COMPLIANCE_ENABLED === false, 'NN compliance remains disabled')
assert(DELIVERY_CITIES.includes('Rijeka') && DELIVERY_CITIES.includes('Otok Krk'), 'Fresh delivery cities are unchanged')

const freshGa4 = ga4PurchaseFromCheckoutSession(
  {
    id: 'cs_fresh',
    payment_intent: 'pi_fresh',
    amount_total: 5500,
    metadata: { bouquetSize: 'M' },
  },
  { S: 45, M: 55, L: 70 },
)
assert(!('error' in freshGa4) && freshGa4.itemId === 'buket-m', 'Fresh GA4 mapping still uses bouquet size')

console.log('PASS: artificial security helpers')
