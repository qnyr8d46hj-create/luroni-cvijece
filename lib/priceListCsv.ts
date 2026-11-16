import {
  NO_SPECIAL_SALE_MARKER,
  PRICE_LIST_FILE_KIND,
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

// NN 132/2026-1584 article 3(2), in that order. Column names are not prescribed.
// Empty cells are fields that do not apply to these bouquets (no unit-price
// obligation, no barcode). "ne" is not a prescribed token: see
// SPECIAL_SALE_ENCODING_UNRESOLVED. The separate special-sale name column and
// the dostupnost column from the repealed NN 101/2026 decision are omitted.
export const PRICE_LIST_COLUMNS = [
  'naziv',
  'sifra_proizvoda',
  'marka',
  'neto_kolicina',
  'jedinica_mjere',
  'maloprodajna_cijena',
  'poseban_oblik_prodaje',
  'jedinicna_cijena',
  'barkod',
  'ean_barkod',
  'bazna_cijena',
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
      naziv:                 bouquet.name,
      sifra_proizvoda:       bouquet.code,
      marka:                 BRAND_NAME,
      neto_kolicina:         '',
      jedinica_mjere:        '',
      maloprodajna_cijena:   money(bouquet.currentEur),
      poseban_oblik_prodaje: NO_SPECIAL_SALE_MARKER,
      jedinicna_cijena:      '',
      barkod:                '',
      ean_barkod:            '',
      bazna_cijena:          money(bouquet.anchorEur),
    })
  }

  const currentAmounts = customSelectableAmounts()
  const anchorAmounts  = new Set(customAnchorAmounts())

  for (const amount of currentAmounts) {
    rows.push({
      naziv:                 `${CUSTOM_BOUQUET.name} – ${amount} €`,
      sifra_proizvoda:       customVariantCode(amount),
      marka:                 BRAND_NAME,
      neto_kolicina:         '',
      jedinica_mjere:        '',
      maloprodajna_cijena:   money(amount),
      poseban_oblik_prodaje: NO_SPECIAL_SALE_MARKER,
      jedinicna_cijena:      '',
      barkod:                '',
      ean_barkod:            '',
      bazna_cijena:          anchorAmounts.has(amount) ? money(amount) : '',
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

/** NN 132/2026-1584 article 6(3): GGGGMMDD_SSMM in Europe/Zagreb. No seconds and no offset. */
export function zagrebTimestampForFilename(now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone:  'Europe/Zagreb',
      year:      'numeric',
      month:     '2-digit',
      day:       '2-digit',
      hour:      '2-digit',
      minute:    '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now).map(part => [part.type, part.value]),
  ) as Record<string, string>

  return `${parts.year}${parts.month}${parts.day}_${parts.hour}${parts.minute}`
}

export function buildPriceListFilename(
  outlet: ConfirmedPriceListOutlet,
  storageNumber: number,
  now = new Date(),
): string {
  if (!Number.isInteger(storageNumber) || storageNumber < 1) {
    throw new Error('Storage number must be a positive integer')
  }
  const oib = requireFilenameToken(outlet.oib, 'OIB')
  if (!/^\d{11}$/.test(oib)) throw new Error('OIB must be 11 digits')
  const form = requireFilenameToken(outletAddressSlug(outlet.form), 'Outlet form')
  const identifier = requireFilenameToken(outlet.identifier, 'Outlet identifier')
  const addressSlug = outletAddressSlug(outlet.address)
  const kind = requireFilenameToken(PRICE_LIST_FILE_KIND, 'Price list kind')
  return `${oib}_${form}_${addressSlug}_${identifier}_${kind}_${storageNumber}_${zagrebTimestampForFilename(now)}.csv`
}
