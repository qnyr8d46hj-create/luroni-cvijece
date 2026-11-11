import { adminDb } from '@/lib/firebaseAdmin'
import { zagrebCalendarDate } from '@/lib/productPrices'
import { buildPriceListFilename, serializePriceListCsv } from '@/lib/priceListCsv'
import {
  PRICE_LIST_RETENTION_DAYS,
  PRICE_LIST_SEQUENCE_ID,
  isPriceListSnapshotId,
  nextStorageNumber,
  requirePriceListPublication,
  retentionCutoffDate,
} from '@/lib/priceListPublication'

export const PRICE_LIST_COLLECTION = 'cjenik_snapshots'
export { PRICE_LIST_RETENTION_DAYS, retentionCutoffDate }

export type PriceListSnapshot = {
  date:          string
  filename:      string
  csv:           string
  publishedAt:   string
  /** Monotonic broj pohrane. Never rewritten for an existing day. */
  version:       number
}

/** One immutable CSV snapshot per Europe/Zagreb calendar day. Repeat calls return the existing document. */
export async function publishTodaysPriceList(now = new Date()): Promise<PriceListSnapshot> {
  const outlet = requirePriceListPublication()
  const date = zagrebCalendarDate(now)
  const ref = adminDb.collection(PRICE_LIST_COLLECTION).doc(date)
  const sequenceRef = adminDb.collection(PRICE_LIST_COLLECTION).doc(PRICE_LIST_SEQUENCE_ID)

  return adminDb.runTransaction(async tx => {
    const existing = await tx.get(ref)
    if (existing.exists) return existing.data() as PriceListSnapshot

    const sequenceSnap = await tx.get(sequenceRef)
    const last = sequenceSnap.exists ? sequenceSnap.get('lastStorageNumber') : null
    const storageNumber = nextStorageNumber(typeof last === 'number' ? last : null)
    const snapshot: PriceListSnapshot = {
      date,
      filename:    buildPriceListFilename(outlet, storageNumber, now),
      csv:         serializePriceListCsv(),
      publishedAt: now.toISOString(),
      version:     storageNumber,
    }
    tx.set(ref, snapshot)
    tx.set(sequenceRef, { lastStorageNumber: storageNumber })
    return snapshot
  })
}

export async function pruneOldPriceLists(now = new Date()): Promise<number> {
  const cutoff = retentionCutoffDate(now)
  const docs   = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  const stale  = docs.docs.filter(doc => isPriceListSnapshotId(doc.id) && doc.id < cutoff)
  if (stale.length === 0) return 0

  const batch = adminDb.batch()
  for (const doc of stale) batch.delete(doc.ref)
  await batch.commit()
  return stale.length
}

export async function listPriceListSnapshots(now = new Date()): Promise<PriceListSnapshot[]> {
  const cutoff = retentionCutoffDate(now)
  const docs   = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  return docs.docs
    .filter(doc => isPriceListSnapshotId(doc.id))
    .map(doc => doc.data() as PriceListSnapshot)
    .filter(snapshot => snapshot.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPriceListSnapshotByFilename(
  filename: string,
): Promise<PriceListSnapshot | null> {
  const docs = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  const match = docs.docs.find(doc =>
    isPriceListSnapshotId(doc.id) && (doc.data() as PriceListSnapshot).filename === filename,
  )
  return match ? match.data() as PriceListSnapshot : null
}

export async function getTodaysPriceListSnapshot(
  now = new Date(),
): Promise<PriceListSnapshot | null> {
  const snap = await adminDb.collection(PRICE_LIST_COLLECTION)
    .doc(zagrebCalendarDate(now))
    .get()
  return snap.exists ? snap.data() as PriceListSnapshot : null
}
