// Regulatory outlet identity for NN 101/2026-1213 filenames.
//
// Confirmed on 2026-11-16 by the business: the webshop address is the
// registered office of Luroni Gaja d.o.o. The Rijeka flower warehouse
// (Morettiev prolaz 1b) has no customer counter and is not this outlet.
//
// The business chose the outlet type "Internetska trgovina" and the
// label P-01 on 2026-11-16. P-01 is a trader-chosen label, not a number
// issued by a register. Ministry clarification of 18 September 2026
// (Klasa: 330-01/25-01/13, Ur. broj: 526-07-02-26-136) allows that.

import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'

export const CONFIRMED_WEBSHOP_LEGAL_NAME = 'Luroni Gaja d.o.o.'
export const CONFIRMED_WEBSHOP_ADDRESS = 'Gornja Švarča 19, 47000 Karlovac'
export const CONFIRMED_WEBSHOP_COUNTRY = 'Croatia'

export const CONFIRMED_OUTLET_FORM = 'Internetska trgovina'
export const CONFIRMED_OUTLET_IDENTIFIER = 'P-01'

export type ConfirmedPriceListOutlet = {
  /** Human outlet type. The filename uses its hyphenated form. */
  form: string
  /** Postal address confirmed as the regulatory sales outlet. */
  address: string
  /** Trader-chosen outlet label. Not a registered code. */
  identifier: string
}

export const CONFIRMED_PRICE_LIST_OUTLET: ConfirmedPriceListOutlet = {
  form: CONFIRMED_OUTLET_FORM,
  address: CONFIRMED_WEBSHOP_ADDRESS,
  identifier: CONFIRMED_OUTLET_IDENTIFIER,
}

/**
 * Proposed machine value for bouquets a customer can order.
 * Not written into the public file while AVAILABILITY_LEGAL_VALUE_CONFIRMED
 * is false.
 *
 * The 18 September 2026 clarification says a product is "dostupno" only when
 * it is physically in stock and on sale at that outlet. These bouquets are
 * made after the order, so that word is not yet acceptable. "nedostupno"
 * would say they cannot be bought, which is also wrong. The unpublished
 * pravilnik has not resolved this.
 */
export const PROPOSED_ORDERABLE_AVAILABILITY = 'dostupno' as const
export const AVAILABILITY_LEGAL_VALUE_CONFIRMED = false

export function freshBouquetAvailabilityValue(
  confirmed = AVAILABILITY_LEGAL_VALUE_CONFIRMED,
): '' | typeof PROPOSED_ORDERABLE_AVAILABILITY {
  return confirmed ? PROPOSED_ORDERABLE_AVAILABILITY : ''
}

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
