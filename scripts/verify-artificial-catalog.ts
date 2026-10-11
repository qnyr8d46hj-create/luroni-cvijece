import {
  compareArtificialBouquets,
  defaultArtificialBouquetImage,
  isArtificialBouquetSku,
  normalizeArtificialBouquetImage,
  parseArtificialBouquet,
  toPublicArtificialBouquets,
  type ArtificialBouquet,
} from '../lib/artificialBouquets'

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

assert(isArtificialBouquetSku('UM-001') && isArtificialBouquetSku('UM-017'), 'UM-001 and UM-017 are valid SKUs')
assert(!isArtificialBouquetSku('UM-M-01') && !isArtificialBouquetSku('UM-L-01'), 'Old size-based SKUs are rejected')
assert(!isArtificialBouquetSku('UM-1') && !isArtificialBouquetSku('UM-01'), 'SKU must be three digits')

const valid = parseArtificialBouquet('UM-001', {
  name: ' Aranžman 1 ',
  priceEur: 89,
  image: '',
  available: true,
  active: true,
  sortOrder: 1,
})
assert('product' in valid, 'Valid row must parse')
if ('product' in valid) {
  assert(valid.product.sku === 'UM-001', 'SKU comes from document ID')
  assert(valid.product.name === 'Aranžman 1', 'name is trimmed')
  assert(
    Object.keys(valid.product).join(',') === 'sku,name,priceEur,image,available,active,sortOrder',
    'Catalog fields exclude size',
  )
  assert(valid.product.image === defaultArtificialBouquetImage('UM-001'), 'Empty image uses SKU.webp')
}

assert(
  'issue' in parseArtificialBouquet('UM-M-01', {
    name: 'Aranžman 1',
    priceEur: 10,
    available: true,
    active: true,
    sortOrder: 1,
  }),
  'Legacy UM-M-01 SKU is rejected',
)

assert(
  'issue' in parseArtificialBouquet('UM-001', {
    name: 'Aranžman 1',
    priceEur: 0,
    available: true,
    active: true,
    sortOrder: 1,
  }),
  'priceEur 0 is rejected so example prices cannot go live',
)

assert(
  'issue' in parseArtificialBouquet('fresh-s', {
    name: 'Aranžman 1',
    priceEur: 10,
    available: true,
    active: true,
    sortOrder: 1,
  }),
  'Non-UM SKUs are rejected',
)

assert(
  normalizeArtificialBouquetImage('UM-002', '../secret.webp') === null,
  'Path traversal in image is rejected',
)
assert(
  normalizeArtificialBouquetImage('UM-002', 'UM-002.webp') === '/images/umjetni-buketi/UM-002.webp',
  'Bare filename is namespaced to the artificial image folder',
)

const mixed: ArtificialBouquet[] = [
  {
    sku: 'UM-003',
    name: 'Aranžman 3',
    priceEur: 1,
    image: '/images/umjetni-buketi/UM-003.webp',
    available: true,
    active: true,
    sortOrder: 20,
  },
  {
    sku: 'UM-002',
    name: 'Aranžman 2',
    priceEur: 1,
    image: '/images/umjetni-buketi/UM-002.webp',
    available: false,
    active: true,
    sortOrder: 1,
  },
  {
    sku: 'UM-001',
    name: 'Aranžman 1',
    priceEur: 1,
    image: '/images/umjetni-buketi/UM-001.webp',
    available: true,
    active: true,
    sortOrder: 20,
  },
  {
    sku: 'UM-004',
    name: 'Aranžman 4',
    priceEur: 1,
    image: '/images/umjetni-buketi/UM-004.webp',
    available: true,
    active: false,
    sortOrder: 1,
  },
]

const sortedIds = [...mixed].sort(compareArtificialBouquets).map(item => item.sku)
assert(
  sortedIds.join(',') === 'UM-004,UM-001,UM-003,UM-002',
  'Sort is available first, then sortOrder, then SKU',
)

const publicCatalog = toPublicArtificialBouquets(
  mixed,
  image => image.endsWith('UM-001.webp') || image.endsWith('UM-002.webp') || image.endsWith('UM-003.webp'),
)
assert(
  publicCatalog.products.map(item => item.sku).join(',') === 'UM-001,UM-003,UM-002',
  'Inactive products are hidden',
)
assert(publicCatalog.products[2]?.available === false, 'Unavailable active products remain visible after available ones')

const empty = toPublicArtificialBouquets([], () => true)
assert(empty.products.length === 0, 'Empty Firestore collection must yield an empty catalog')

console.log('Artificial catalog checks passed (no Firestore writes).')
