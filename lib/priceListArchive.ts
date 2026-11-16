import { adminDb } from '@/lib/firebaseAdmin'
import { zagrebCalendarDate } from '@/lib/productPrices'
import { buildPriceListFilename, serializePriceListCsv } from '@/lib/priceListCsv'
import {
  PRICE_LIST_CURRENT_ID,
  PRICE_LIST_RETENTION_DAYS,
  PRICE_LIST_SEQUENCE_ID,
  decidePriceListPublication,
  nextStorageNumber,
  replacedSnapshotIsRetained,
  requirePriceListPublication,
  retentionCutoffDate,
} from '@/lib/priceListPublication'

export const PRICE_LIST_COLLECTION = 'cjenik_snapshots'
export { PRICE_LIST_RETENTION_DAYS, retentionCutoffDate }

export type PriceListSnapshot = {
  date:        string
  filename:    string
  csv:         string
  publishedAt: string
  /** Monotonic broj pohrane from NN 132/2026-1584. */
  version:     number
  /** Set when a newer file replaces this one. Null while it is current. */
  replacedAt:  string | null
}

export type PriceListPublishResult = {
  action:   'keep' | 'replace'
  snapshot: PriceListSnapshot
}

function archiveDocId(version: number): string {
  return `archive-${version}`
}

function isSnapshotDoc(id: string): boolean {
  return id === PRICE_LIST_CURRENT_ID || id.startsWith('archive-')
}

/**
 * Publish the current goods file. An unchanged body keeps the stored file
 * and its storage number. A different body replaces it at the same logical
 * record and starts the 15-day archive clock for the previous file.
 */
export async function publishCurrentPriceList(now = new Date()): Promise<PriceListPublishResult> {
  const outlet = requirePriceListPublication()
  const csv = serializePriceListCsv()
  const date = zagrebCalendarDate(now)
  const currentRef = adminDb.collection(PRICE_LIST_COLLECTION).doc(PRICE_LIST_CURRENT_ID)
  const sequenceRef = adminDb.collection(PRICE_LIST_COLLECTION).doc(PRICE_LIST_SEQUENCE_ID)

  return adminDb.runTransaction(async tx => {
    const existing = await tx.get(currentRef)
    const current = existing.exists ? existing.data() as PriceListSnapshot : null
    if (current && decidePriceListPublication(current.csv, csv) === 'keep') {
      return { action: 'keep' as const, snapshot: current }
    }

    const sequenceSnap = await tx.get(sequenceRef)
    const last = sequenceSnap.exists ? sequenceSnap.get('lastStorageNumber') : null
    const storageNumber = nextStorageNumber(typeof last === 'number' ? last : null)
    const snapshot: PriceListSnapshot = {
      date,
      filename:    buildPriceListFilename(outlet, storageNumber, now),
      csv,
      publishedAt: now.toISOString(),
      version:     storageNumber,
      replacedAt:  null,
    }

    if (current) {
      const archived: PriceListSnapshot = { ...current, replacedAt: now.toISOString() }
      tx.set(adminDb.collection(PRICE_LIST_COLLECTION).doc(archiveDocId(current.version)), archived)
    }
    tx.set(currentRef, snapshot)
    tx.set(sequenceRef, { lastStorageNumber: storageNumber })
    return { action: 'replace' as const, snapshot }
  })
}

export async function pruneOldPriceLists(now = new Date()): Promise<number> {
  const docs  = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  const stale = docs.docs.filter(doc => {
    if (!doc.id.startsWith('archive-')) return false
    const replacedAt = (doc.data() as PriceListSnapshot).replacedAt
    return typeof replacedAt === 'string' && !replacedSnapshotIsRetained(replacedAt, now)
  })
  if (stale.length === 0) return 0

  const batch = adminDb.batch()
  for (const doc of stale) batch.delete(doc.ref)
  await batch.commit()
  return stale.length
}

export async function listPriceListSnapshots(now = new Date()): Promise<PriceListSnapshot[]> {
  const docs = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  return docs.docs
    .filter(doc => doc.id.startsWith('archive-'))
    .map(doc => doc.data() as PriceListSnapshot)
    .filter(snapshot =>
      typeof snapshot.replacedAt === 'string' &&
      replacedSnapshotIsRetained(snapshot.replacedAt, now),
    )
    .sort((a, b) => (b.replacedAt ?? '').localeCompare(a.replacedAt ?? ''))
}

export async function getPriceListSnapshotByFilename(
  filename: string,
  now = new Date(),
): Promise<PriceListSnapshot | null> {
  const docs = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  const match = docs.docs.find(doc =>
    isSnapshotDoc(doc.id) && (doc.data() as PriceListSnapshot).filename === filename,
  )
  if (!match) return null
  const snapshot = match.data() as PriceListSnapshot
  if (snapshot.replacedAt && !replacedSnapshotIsRetained(snapshot.replacedAt, now)) return null
  return snapshot
}

export async function getCurrentPriceListSnapshot(): Promise<PriceListSnapshot | null> {
  const snap = await adminDb.collection(PRICE_LIST_COLLECTION).doc(PRICE_LIST_CURRENT_ID).get()
  return snap.exists ? snap.data() as PriceListSnapshot : null
}
