import { parseArtificialOrderRequest } from '../lib/artificialOrderRequest'
import { buildTrustedArtificialOrder } from '../lib/trustedArtificialOrder'
import { parseArtificialBouquet } from '../lib/artificialBouquets'
import { euroToCents } from '../lib/euroCents'
import { ARTIFICIAL_ORDER_TYPE } from '../lib/artificialBouquetPaths'
import { buildMerchantEmailHtml, isArtificialOrderEmail, type OrderEmailPayload } from '../lib/sendOrderEmail'

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}
function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

assert(euroToCents(40) === 4000, '€40 → 4000 cents')
assert(euroToCents(50) === 5000, '€50 → 5000 cents')
assert(euroToCents(60) === 6000, '€60 → 6000 cents')

const parsed = parseArtificialOrderRequest({
  sku: 'UM-007',
  paymentMethod: 'cash',
  fullName: 'Ana Horvat',
  phone: '+385 91 234 5678',
  email: 'ana@email.com',
  deliveryAddress: 'Ulica 1',
  deliveryCity: 'Rijeka',
  deliveryDate: '2099-01-15',
  deliveryTime: '',
  productPrice: 1,
})
assert(parsed.ok, 'Artificial order request parses')

const product = parseArtificialBouquet('UM-007', {
  name: 'Aranžman 7',
  priceEur: 50,
  available: true,
  active: true,
  sortOrder: 7,
})
assert('product' in product, 'Product parses')
if (parsed.ok && 'product' in product) {
  const trusted = buildTrustedArtificialOrder(parsed.data, product.product)
  assert(!('error' in trusted), 'Trusted cash order builds')
  if (!('error' in trusted)) {
    assert(trusted.orderType === ARTIFICIAL_ORDER_TYPE, 'orderType is artificial')
    assert(trusted.status === 'new', 'Cash status is new')
    assert(trusted.productPrice === 50, 'Cash price comes from the product, not the client')
    assert(!('bouquetSize' in trusted), 'No fresh size field')
  }
}

const artificialEmail: OrderEmailPayload = {
  fullName: 'Ana Horvat',
  phone: '+385 91 234 5678',
  email: 'ana@email.com',
  deliveryAddress: 'Ulica 1',
  deliveryCity: 'Rijeka',
  bouquetSize: 'L',
  bouquetPrice: 1,
  productPrice: 40,
  deliveryDate: '2026-10-20',
  deliveryTime: '12-16',
  cardMessage: 'Hvala',
  paymentMethod: 'card',
  orderType: 'artificial',
  sku: 'UM-001',
  productName: 'Aranžman 1',
}
assert(isArtificialOrderEmail(artificialEmail), 'Artificial email payload is detected')
const html = buildMerchantEmailHtml(artificialEmail)
assert(html.includes('UM-001') && !html.includes('Buket L'), 'Merchant email shows SKU not fresh size')

console.log('PASS: artificial checkout helpers')
