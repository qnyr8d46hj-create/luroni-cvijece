// Outlet identity for NN 132/2026-1584 filenames.
//
// Confirmed on 2026-11-16 by the business: the webshop address is the
// registered office of Luroni Gaja d.o.o. The Rijeka flower warehouse
// (Morettiev prolaz 1b) has no customer counter and is not this outlet.
// The OIB is the one already published on the legal pages.
//
// The business chose the outlet type "Internetska trgovina" and the
// label P-01 on 2026-11-16. P-01 is a trader-chosen label, not a number
// issued by a register. NN 132/2026-1584 requires the outlet classification
// from the separate classification rules and does not print a code list.
// This keeps the confirmed webshop type rather than inventing a code.

import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'

export const CONFIRMED_WEBSHOP_LEGAL_NAME = 'Luroni Gaja d.o.o.'
export const CONFIRMED_WEBSHOP_ADDRESS = 'Gornja Švarča 19, 47000 Karlovac'
export const CONFIRMED_WEBSHOP_COUNTRY = 'Croatia'
export const CONFIRMED_WEBSHOP_OIB = '89564174048'

export const CONFIRMED_OUTLET_FORM = 'Internetska trgovina'
export const CONFIRMED_OUTLET_IDENTIFIER = 'P-01'

/** Goods file. Delivery is not a separately priced service. */
export const PRICE_LIST_FILE_KIND = 'roba' as const

export type ConfirmedPriceListOutlet = {
  /** Human outlet type. The filename uses its hyphenated form. */
  form: string
  /** Postal address confirmed as the regulatory sales outlet. */
  address: string
  /** Trader-chosen outlet label. Not a registered code. */
  identifier: string
  /** Company OIB. Required in the NN 132/2026-1584 filename. */
  oib: string
}

export const CONFIRMED_PRICE_LIST_OUTLET: ConfirmedPriceListOutlet = {
  form: CONFIRMED_OUTLET_FORM,
  address: CONFIRMED_WEBSHOP_ADDRESS,
  identifier: CONFIRMED_OUTLET_IDENTIFIER,
  oib: CONFIRMED_WEBSHOP_OIB,
}

/**
 * NN 132/2026-1584 does not list dostupno/nedostupno. The CSV does not emit
 * this value. The 18 September 2026 clarification tied "dostupno" to physical
 * stock under the repealed decision. That question stays open for any later
 * rule that brings the field back. These bouquets are made after the order.
 */
export const ORDERABLE_BOUQUET_AVAILABILITY = 'dostupno' as const
export const AVAILABILITY_STOCK_RULE_UNRESOLVED = true

/**
 * NN 132/2026-1584 asks whether the retail price was applied during a special
 * sale. It does not prescribe the word "ne" or a separate column. No bouquet
 * is on special sale. SPECIAL_SALE_ENCODING_UNRESOLVED stays true.
 */
export const NO_SPECIAL_SALE_MARKER = 'ne' as const
export const SPECIAL_SALE_ENCODING_UNRESOLVED = true

/**
 * Artificial arrangements are not offered on the webshop, so they stay out
 * of the public price list. Their Firestore records are not touched here.
 * If the catalog is offered online again, change this only after a fresh
 * decision about their reference prices. Do not flip it as part of going public.
 */
export type ArtificialPriceListDecision = 'excluded-not-offered' | 'include-when-offered'

export const ARTIFICIAL_PRICE_LIST_DECISION: ArtificialPriceListDecision = 'excluded-not-offered'

export function artificialArrangementsBlockPublication(
  offeredOnline = ARTIFICIAL_ARRANGEMENTS_PUBLIC,
  decision: ArtificialPriceListDecision = ARTIFICIAL_PRICE_LIST_DECISION,
): boolean {
  return offeredOnline && decision !== 'include-when-offered'
}

export function publicPriceListIncludesArtificialArrangements(
  offeredOnline = ARTIFICIAL_ARRANGEMENTS_PUBLIC,
  decision: ArtificialPriceListDecision = ARTIFICIAL_PRICE_LIST_DECISION,
): boolean {
  return offeredOnline && decision === 'include-when-offered'
}
