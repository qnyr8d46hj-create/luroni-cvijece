import { zagrebCalendarDate } from '@/lib/productPrices'
import {
  ARTIFICIAL_PRICE_LIST_DECISION,
  CONFIRMED_PRICE_LIST_OUTLET,
  CONFIRMED_WEBSHOP_ADDRESS,
  artificialArrangementsBlockPublication,
  type ArtificialPriceListDecision,
  type ConfirmedPriceListOutlet,
} from '@/lib/priceListOutlet'
import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'

export const PRICE_LIST_RETENTION_DAYS = 15
export const PRICE_LIST_SEQUENCE_ID = 'sequence'
export const PRICE_LIST_CURRENT_ID = 'current'
export const PRICE_LIST_CRON_UTC_HOUR = 5
/** NN 132/2026-1584 article 3(5): a changed file is due by 11:00 Europe/Zagreb. */
export const PRICE_LIST_DEADLINE_MINUTES = 11 * 60

const FILENAME_TOKEN = /^[A-Za-z0-9-]+$/

export type PriceListBlockerCode =
  | 'outlet-address'
  | 'outlet-form'
  | 'outlet-identifier'
  | 'outlet-oib'
  | 'artificial-arrangements'

export class PriceListPublicationBlocked extends Error {
  readonly codes: readonly PriceListBlockerCode[]

  constructor(codes: readonly PriceListBlockerCode[]) {
    super(`Price list publication blocked: ${codes.join(', ')}`)
    this.name = 'PriceListPublicationBlocked'
    this.codes = codes
  }
}

function filledToken(value: string | undefined): boolean {
  return typeof value === 'string' && FILENAME_TOKEN.test(value)
}

function filenameToken(value: string | undefined): string | null {
  if (!value?.trim()) return null
  try {
    const token = outletAddressSlug(value)
    return FILENAME_TOKEN.test(token) ? token : null
  } catch {
    return null
  }
}

export function requireFilenameToken(value: string, label: string): string {
  if (!FILENAME_TOKEN.test(value)) {
    throw new Error(`${label} must use letters, digits, and hyphens only`)
  }
  return value
}

export function priceListPublicationBlockers(
  outlet: ConfirmedPriceListOutlet | null = CONFIRMED_PRICE_LIST_OUTLET,
  artificial: {
    offeredOnline: boolean
    decision: ArtificialPriceListDecision
  } = {
    offeredOnline: ARTIFICIAL_ARRANGEMENTS_PUBLIC,
    decision: ARTIFICIAL_PRICE_LIST_DECISION,
  },
): PriceListBlockerCode[] {
  const blockers: PriceListBlockerCode[] = []
  const address = (outlet?.address ?? CONFIRMED_WEBSHOP_ADDRESS).trim()
  if (!address) blockers.push('outlet-address')
  if (!outlet || !filenameToken(outlet.form)) blockers.push('outlet-form')
  if (!outlet || !filledToken(outlet.identifier)) blockers.push('outlet-identifier')
  if (!outlet || !/^\d{11}$/.test(outlet.oib)) blockers.push('outlet-oib')
  if (artificialArrangementsBlockPublication(artificial.offeredOnline, artificial.decision)) {
    blockers.push('artificial-arrangements')
  }
  return blockers
}

export function isPriceListPublishable(): boolean {
  return priceListPublicationBlockers().length === 0
}

export function requirePriceListPublication(): ConfirmedPriceListOutlet {
  const blockers = priceListPublicationBlockers()
  if (blockers.length > 0 || !CONFIRMED_PRICE_LIST_OUTLET) {
    throw new PriceListPublicationBlocked(blockers)
  }
  return CONFIRMED_PRICE_LIST_OUTLET
}

export function outletAddressSlug(address: string): string {
  const slug = address
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!FILENAME_TOKEN.test(slug)) {
    throw new Error('Outlet address cannot be turned into a filename token')
  }
  return slug
}

export function nextStorageNumber(lastIssued: number | null): number {
  if (lastIssued == null) return 1
  if (!Number.isInteger(lastIssued) || lastIssued < 1) {
    throw new Error('Invalid price-list storage number')
  }
  return lastIssued + 1
}

export function isPriceListSnapshotId(id: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(id)
}

function calendarDatePlusDays(yyyyMmDd: string, delta: number): string {
  const [year, month, day] = yyyyMmDd.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10)
}

export function retentionCutoffDate(now = new Date()): string {
  return calendarDatePlusDays(zagrebCalendarDate(now), -PRICE_LIST_RETENTION_DAYS)
}

/** A replaced file stays available on the replacement date and for 15 Zagreb calendar days after it. */
export function replacedSnapshotIsRetained(replacedAtIso: string, now = new Date()): boolean {
  return zagrebCalendarDate(new Date(replacedAtIso)) >= retentionCutoffDate(now)
}

export function priceListCsvBody(csv: string): string {
  return csv.replace(/^\uFEFF/, '')
}

/** Keep the stored file when the price-list body is unchanged. Replace it when the body differs or nothing is stored yet. */
export function decidePriceListPublication(existingCsv: string | null, nextCsv: string): 'keep' | 'replace' {
  if (existingCsv == null) return 'replace'
  return priceListCsvBody(existingCsv) === priceListCsvBody(nextCsv) ? 'keep' : 'replace'
}

export function latestHobbyCronUtc(hourUtc: number, year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, hourUtc, 59, 59))
}

export function zagrebClockMinutes(date: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zagreb',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).map(part => [part.type, part.value]),
  ) as Record<string, string>
  return Number(parts.hour) * 60 + Number(parts.minute)
}

/** Hobby may run a daily cron anywhere in the UTC hour. Both winter and summer must finish before 11:00 Europe/Zagreb. */
export function scheduledCronMeetsDeadline(hourUtc = PRICE_LIST_CRON_UTC_HOUR): boolean {
  const winter = zagrebClockMinutes(latestHobbyCronUtc(hourUtc, 2026, 10, 17))
  const summer = zagrebClockMinutes(latestHobbyCronUtc(hourUtc, 2026, 6, 17))
  return winter < PRICE_LIST_DEADLINE_MINUTES && summer < PRICE_LIST_DEADLINE_MINUTES
}
