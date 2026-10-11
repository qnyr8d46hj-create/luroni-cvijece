// ── Artificial floral arrangements catalog (Phase 1) ──────────
//
// Collection: artificial_bouquets
// Document ID = SKU (e.g. UM-001). Do not duplicate SKU as an `id` field.
// Initial catalog: UM-001 … UM-017, public names "Aranžman 1" … "Aranžman 17".
// No S/M/L size field — each model has its own priceEur (three tiers later).
//
// Server-side only. Never import this module from a Client Component.
// Public catalog is read with Firebase Admin. There are no client writes.
// Recommended Firestore rules: deny all client access to this collection
// (the Admin SDK bypasses rules). Do not change the existing `orders` rules.

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ARTIFICIAL_BOUQUET_IMAGE_DIR,
  ARTIFICIAL_BOUQUETS_COLLECTION,
} from '@/lib/artificialBouquetPaths'

export {
  ARTIFICIAL_BOUQUET_IMAGE_DIR,
  ARTIFICIAL_BOUQUET_ORDER_PATH,
  ARTIFICIAL_BOUQUET_PAGE_PATH,
  ARTIFICIAL_BOUQUETS_COLLECTION,
  ARTIFICIAL_ORDER_TYPE,
} from '@/lib/artificialBouquetPaths'

/** Internal SKU: UM-001 … UM-017 initially; 3-digit suffix keeps room to grow. */
const SKU_PATTERN = /^UM-\d{3}$/
const SAFE_IMAGE_FILE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(webp|jpg|jpeg|png)$/

export type ArtificialBouquet = {
  sku: string
  name: string
  priceEur: number
  image: string
  available: boolean
  active: boolean
  sortOrder: number
}

export type ArtificialBouquetParseIssue = {
  sku: string
  reason: string
}

export function isArtificialBouquetSku(value: string): boolean {
  return SKU_PATTERN.test(value)
}

export function defaultArtificialBouquetImage(sku: string): string {
  return `${ARTIFICIAL_BOUQUET_IMAGE_DIR}/${sku}.webp`
}

export function normalizeArtificialBouquetImage(sku: string, raw: unknown): string | null {
  if (raw == null || raw === '') return defaultArtificialBouquetImage(sku)
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim().replaceAll('\\', '/')
  if (!trimmed || trimmed.includes('..')) return null

  const filename = trimmed.includes('/') ? trimmed.slice(trimmed.lastIndexOf('/') + 1) : trimmed
  if (!SAFE_IMAGE_FILE.test(filename)) return null

  if (trimmed.startsWith(`${ARTIFICIAL_BOUQUET_IMAGE_DIR}/`)) {
    if (trimmed !== `${ARTIFICIAL_BOUQUET_IMAGE_DIR}/${filename}`) return null
    return trimmed
  }

  if (trimmed.includes('/')) return null
  return `${ARTIFICIAL_BOUQUET_IMAGE_DIR}/${filename}`
}

export function artificialBouquetImageExists(imagePath: string): boolean {
  if (!imagePath.startsWith(`${ARTIFICIAL_BOUQUET_IMAGE_DIR}/`)) return false
  const relative = imagePath.slice(1)
  return existsSync(join(process.cwd(), 'public', relative))
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim().replace(',', '.'))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function asBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (value === 1) return true
    if (value === 0) return false
    return null
  }
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'da' || normalized === 'yes') {
    return true
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'ne' || normalized === 'no') {
    return false
  }
  return null
}

function asSortOrder(value: unknown): number | null {
  const parsed = asFiniteNumber(value)
  if (parsed == null || !Number.isInteger(parsed)) return null
  return parsed
}

export function parseArtificialBouquet(
  sku: string,
  data: unknown,
): { product: ArtificialBouquet } | { issue: ArtificialBouquetParseIssue } {
  if (!isArtificialBouquetSku(sku)) {
    return { issue: { sku, reason: 'SKU must match UM-NNN (e.g. UM-001)' } }
  }
  if (!data || typeof data !== 'object') {
    return { issue: { sku, reason: 'Document data is missing' } }
  }

  const record = data as Record<string, unknown>
  const name = asTrimmedString(record.name)
  const priceEur = asFiniteNumber(record.priceEur)
  const available = asBoolean(record.available)
  const active = asBoolean(record.active)
  const sortOrder = asSortOrder(record.sortOrder)
  const image = normalizeArtificialBouquetImage(sku, record.image)

  if (!name) return { issue: { sku, reason: 'name is required' } }
  if (priceEur == null || priceEur <= 0) {
    return { issue: { sku, reason: 'priceEur must be a positive number' } }
  }
  if (available == null) return { issue: { sku, reason: 'available must be true or false' } }
  if (active == null) return { issue: { sku, reason: 'active must be true or false' } }
  if (sortOrder == null) return { issue: { sku, reason: 'sortOrder must be an integer' } }
  if (!image) return { issue: { sku, reason: 'image path is invalid' } }

  return {
    product: {
      sku,
      name,
      priceEur,
      image,
      available,
      active,
      sortOrder,
    },
  }
}

export function compareArtificialBouquets(a: ArtificialBouquet, b: ArtificialBouquet): number {
  if (a.available !== b.available) return a.available ? -1 : 1
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.sku.localeCompare(b.sku)
}

export function toPublicArtificialBouquets(
  parsed: ArtificialBouquet[],
  imageExists = artificialBouquetImageExists,
): { products: ArtificialBouquet[]; skipped: ArtificialBouquetParseIssue[] } {
  const skipped: ArtificialBouquetParseIssue[] = []
  const visible = parsed.filter(product => {
    if (!product.active) return false
    if (!imageExists(product.image)) {
      skipped.push({
        sku: product.sku,
        reason: `active product skipped — image file not found: ${product.image}`,
      })
      return false
    }
    return true
  })

  return {
    products: [...visible].sort(compareArtificialBouquets),
    skipped,
  }
}

export function isPurchasableArtificialBouquet(product: ArtificialBouquet): boolean {
  return product.active && product.available
}

export async function getArtificialBouquetBySku(
  sku: string,
): Promise<ArtificialBouquet | null> {
  if (!isArtificialBouquetSku(sku)) return null
  const { adminDb } = await import('./firebaseAdmin')
  const snapshot = await adminDb.collection(ARTIFICIAL_BOUQUETS_COLLECTION).doc(sku).get()
  if (!snapshot.exists) return null
  const result = parseArtificialBouquet(snapshot.id, snapshot.data())
  if ('issue' in result) return null
  return result.product
}

export async function getPurchasableArtificialBouquet(
  sku: string,
): Promise<ArtificialBouquet | null> {
  const product = await getArtificialBouquetBySku(sku)
  if (!product || !isPurchasableArtificialBouquet(product)) return null
  return product
}

export async function getPublicArtificialBouquets(): Promise<{
  products: ArtificialBouquet[]
  skipped: ArtificialBouquetParseIssue[]
}> {
  const { adminDb } = await import('./firebaseAdmin')
  const snapshot = await adminDb.collection(ARTIFICIAL_BOUQUETS_COLLECTION).get()
  const parsed: ArtificialBouquet[] = []
  const skipped: ArtificialBouquetParseIssue[] = []

  for (const doc of snapshot.docs) {
    const result = parseArtificialBouquet(doc.id, doc.data())
    if ('issue' in result) {
      skipped.push(result.issue)
      continue
    }
    parsed.push(result.product)
  }

  const publicCatalog = toPublicArtificialBouquets(parsed)
  return {
    products: publicCatalog.products,
    skipped: [...skipped, ...publicCatalog.skipped],
  }
}

export function firestorePayloadFromProduct(
  product: ArtificialBouquet,
): Omit<ArtificialBouquet, 'sku'> {
  return {
    name: product.name,
    priceEur: product.priceEur,
    image: product.image,
    available: product.available,
    active: product.active,
    sortOrder: product.sortOrder,
  }
}
