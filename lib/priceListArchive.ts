import { adminDb } from '@/lib/firebaseAdmin'
import { zagrebCalendarDate } from '@/lib/productPrices'
import { buildCurrentPriceList } from '@/lib/priceListCsv'

export const PRICE_LIST_COLLECTION = 'cjenik_snapshots'
export const PRICE_LIST_RETENTION_DAYS = 30

export type PriceListSnapshot = {
  date:        string
  filename:    string
  csv:         string
  publishedAt: string
  version:     number
}

function calendarDatePlusDays(yyyyMmDd: string, delta: number): string {
  const [year, month, day] = yyyyMmDd.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10)
}

export function retentionCutoffDate(now = new Date()): string {
  return calendarDatePlusDays(zagrebCalendarDate(now), -PRICE_LIST_RETENTION_DAYS)
}

/** One immutable CSV snapshot per Europe/Zagreb calendar day. Repeat calls return the existing document. */
export async function publishTodaysPriceList(now = new Date()): Promise<PriceListSnapshot> {
  const date = zagrebCalendarDate(now)
  const ref  = adminDb.collection(PRICE_LIST_COLLECTION).doc(date)

  return adminDb.runTransaction(async tx => {
    const existing = await tx.get(ref)
    if (existing.exists) return existing.data() as PriceListSnapshot

    const generated = buildCurrentPriceList(now)
    const snapshot: PriceListSnapshot = {
      date,
      filename:    generated.filename,
      csv:         generated.csv,
      publishedAt: now.toISOString(),
      version:     1,
    }
    tx.set(ref, snapshot)
    return snapshot
  })
}

export async function pruneOldPriceLists(now = new Date()): Promise<number> {
  const cutoff = retentionCutoffDate(now)
  const docs   = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  const stale  = docs.docs.filter(doc => doc.id < cutoff)
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
    .map(doc => doc.data() as PriceListSnapshot)
    .filter(snapshot => snapshot.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getPriceListSnapshotByFilename(
  filename: string,
): Promise<PriceListSnapshot | null> {
  const docs = await adminDb.collection(PRICE_LIST_COLLECTION).get()
  const match = docs.docs.find(doc => (doc.data() as PriceListSnapshot).filename === filename)
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
