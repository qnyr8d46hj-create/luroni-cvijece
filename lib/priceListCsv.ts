import {
  ORDERABLE_BOUQUET_AVAILABILITY,
  publicPriceListIncludesArtificialArrangements,
  type ConfirmedPriceListOutlet,
} from './priceListOutlet'
import { outletAddressSlug, requireFilenameToken } from './priceListPublication'
import {
  BRAND_NAME,
  CUSTOM_BOUQUET,
  STANDARD_BOUQUETS,
  customAnchorAmounts,
  customSelectableAmounts,
  customVariantCode,
} from './productPrices'

export const PRICE_LIST_COLUMNS = [
  'naziv',
  'sifra_proizvoda',
  'marka',
  'jedinica_mjere',
  'jedinicna_cijena',
  'maloprodajna_cijena',
  // NN 101/2026-1213 asks, with the retail price, whether a special sale
  // applies and, if so, its name. Column names are not prescribed. No bouquet
  // is on special sale, so the answer is "ne" and the name cell is empty.
  // The unpublished pravilnik has not confirmed this split.
  'poseban_oblik_prodaje',
  'naziv_posebnog_oblika',
  // NN 101/2026 says "sidrena cijena". The October draft says "bazna cijena"
  // and does not prescribe the header. Keep this header until the published
  // pravilnik names a column.
  'sidrena_cijena',
  'barkod',
  'dostupnost',
] as const

export type PriceListColumn = (typeof PRICE_LIST_COLUMNS)[number]

export type PriceListRow = Record<PriceListColumn, string>

function money(amount: number): string {
  return amount.toFixed(2)
}

function csvField(value: string): string {
  if (/[;"\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function buildPriceListRows(): PriceListRow[] {
  if (publicPriceListIncludesArtificialArrangements()) {
    throw new Error(
      'Artificial arrangements were marked for the public price list, but no confirmed rows exist yet',
    )
  }

  const rows: PriceListRow[] = []

  for (const bouquet of Object.values(STANDARD_BOUQUETS)) {
    rows.push({
      naziv:                  bouquet.name,
      sifra_proizvoda:        bouquet.code,
      marka:                  BRAND_NAME,
      jedinica_mjere:         '',
      jedinicna_cijena:       '',
      maloprodajna_cijena:    money(bouquet.currentEur),
      poseban_oblik_prodaje:  'ne',
      naziv_posebnog_oblika:  '',
      sidrena_cijena:         money(bouquet.anchorEur),
      barkod:                 '',
      dostupnost:             ORDERABLE_BOUQUET_AVAILABILITY,
    })
  }

  const currentAmounts = customSelectableAmounts()
  const anchorAmounts  = new Set(customAnchorAmounts())

  for (const amount of currentAmounts) {
    rows.push({
      naziv:                  `${CUSTOM_BOUQUET.name} – ${amount} €`,
      sifra_proizvoda:        customVariantCode(amount),
      marka:                  BRAND_NAME,
      jedinica_mjere:         '',
      jedinicna_cijena:       '',
      maloprodajna_cijena:    money(amount),
      poseban_oblik_prodaje:  'ne',
      naziv_posebnog_oblika:  '',
      sidrena_cijena:         anchorAmounts.has(amount) ? money(amount) : '',
      barkod:                 '',
      dostupnost:             ORDERABLE_BOUQUET_AVAILABILITY,
    })
  }

  return rows
}

export function serializePriceListCsv(rows = buildPriceListRows()): string {
  const header = PRICE_LIST_COLUMNS.join(';')
  const body = rows.map(row =>
    PRICE_LIST_COLUMNS.map(column => csvField(row[column])).join(';'),
  ).join('\r\n')
  return `\uFEFF${header}\r\n${body}\r\n`
}

export function zagrebTimestampForFilename(now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone:     'Europe/Zagreb',
      year:         'numeric',
      month:        '2-digit',
      day:          '2-digit',
      hour:         '2-digit',
      minute:       '2-digit',
      second:       '2-digit',
      hourCycle:    'h23',
      timeZoneName: 'longOffset',
    }).formatToParts(now).map(part => [part.type, part.value]),
  ) as Record<string, string>

  const offset = (parts.timeZoneName ?? 'GMT+00:00').replace('GMT', '').replace(':', '')
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}${offset}`
}

export function buildPriceListFilename(
  outlet: ConfirmedPriceListOutlet,
  storageNumber: number,
  now = new Date(),
): string {
  if (!Number.isInteger(storageNumber) || storageNumber < 1) {
    throw new Error('Storage number must be a positive integer')
  }
  const form = requireFilenameToken(outletAddressSlug(outlet.form), 'Outlet form')
  const identifier = requireFilenameToken(outlet.identifier, 'Outlet identifier')
  const addressSlug = outletAddressSlug(outlet.address)
  return `cjenik_${form}_${addressSlug}_${identifier}_${storageNumber}_${zagrebTimestampForFilename(now)}.csv`
}
