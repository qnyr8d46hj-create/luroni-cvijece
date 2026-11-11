import { zagrebCalendarDate } from '@/lib/productPrices'
import {
  AVAILABILITY_LEGAL_VALUE_CONFIRMED,
  CONFIRMED_PRICE_LIST_OUTLET,
  type ConfirmedPriceListOutlet,
} from '@/lib/priceListOutlet'

export const PRICE_LIST_RETENTION_DAYS = 30
export const PRICE_LIST_SEQUENCE_ID = 'sequence'
export const PRICE_LIST_CRON_UTC_HOUR = 5
export const PRICE_LIST_DEADLINE_MINUTES = 8 * 60

const FILENAME_TOKEN = /^[A-Za-z0-9-]+$/

export type PriceListBlockerCode =
  | 'outlet-address'
  | 'outlet-form'
  | 'outlet-identifier'
  | 'availability'

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

export function requireFilenameToken(value: string, label: string): string {
  if (!FILENAME_TOKEN.test(value)) {
    throw new Error(`${label} must use letters, digits, and hyphens only`)
  }
  return value
}

export function priceListPublicationBlockers(
  outlet: ConfirmedPriceListOutlet | null = CONFIRMED_PRICE_LIST_OUTLET,
  availabilityConfirmed = AVAILABILITY_LEGAL_VALUE_CONFIRMED,
): PriceListBlockerCode[] {
  const blockers: PriceListBlockerCode[] = []
  if (!outlet || !outlet.address.trim()) blockers.push('outlet-address')
  if (!outlet || !filledToken(outlet.form)) blockers.push('outlet-form')
  if (!outlet || !filledToken(outlet.identifier)) blockers.push('outlet-identifier')
  if (!availabilityConfirmed) blockers.push('availability')
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

export function retainExistingSnapshot<T>(existing: T | null, created: T): { action: 'keep' | 'create'; snapshot: T } {
  if (existing) return { action: 'keep', snapshot: existing }
  return { action: 'create', snapshot: created }
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

/** Hobby may run a daily cron anywhere in the UTC hour. Both winter and summer must finish before 08:00 Europe/Zagreb. */
export function scheduledCronMeetsDeadline(hourUtc = PRICE_LIST_CRON_UTC_HOUR): boolean {
  const winter = zagrebClockMinutes(latestHobbyCronUtc(hourUtc, 2026, 10, 17))
  const summer = zagrebClockMinutes(latestHobbyCronUtc(hourUtc, 2026, 6, 17))
  return winter < PRICE_LIST_DEADLINE_MINUTES && summer < PRICE_LIST_DEADLINE_MINUTES
}
