import { PRICE_LIST_OUTLET } from './priceListOutlet'
import {
  BRAND_NAME,
  CUSTOM_BOUQUET,
  STANDARD_BOUQUETS,
  customAnchorAmounts,
  customSelectableAmounts,
  customVariantCode,
  zagrebCalendarDate,
} from './productPrices'

export const PRICE_LIST_COLUMNS = [
  'naziv',
  'sifra_proizvoda',
  'marka',
  'jedinica_mjere',
  'jedinicna_cijena',
  'maloprodajna_cijena',
  'poseban_oblik_prodaje',
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
  const rows: PriceListRow[] = []

  for (const bouquet of Object.values(STANDARD_BOUQUETS)) {
    rows.push({
      naziv:                  bouquet.name,
      sifra_proizvoda:        bouquet.code,
      marka:                  BRAND_NAME,
      jedinica_mjere:         '',
      jedinicna_cijena:       '',
      maloprodajna_cijena:    money(bouquet.currentEur),
      poseban_oblik_prodaje:  '',
      sidrena_cijena:         money(bouquet.anchorEur),
      barkod:                 '',
      dostupnost:             'dostupno',
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
      poseban_oblik_prodaje:  '',
      sidrena_cijena:         anchorAmounts.has(amount) ? money(amount) : '',
      barkod:                 '',
      dostupnost:             'dostupno',
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

export function buildPriceListFilename(now = new Date()): string {
  const { form, addressSlug, identifier, version } = PRICE_LIST_OUTLET
  return `cjenik_${form}_${addressSlug}_${identifier}_${version}_${zagrebTimestampForFilename(now)}.csv`
}

export function buildCurrentPriceList(now = new Date()): { csv: string; filename: string; date: string } {
  return {
    csv:      serializePriceListCsv(),
    filename: buildPriceListFilename(now),
    date:     zagrebCalendarDate(now),
  }
}
