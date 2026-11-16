// Regulatory outlet identity for NN 101/2026-1213 filenames.
//
// Confirmed on 2026-11-16 by the business: the webshop address is the
// registered office of Luroni Gaja d.o.o. The Rijeka flower warehouse
// (Morettiev prolaz 1b) has no customer counter and is not this outlet.
//
// "Oznaka prodajnog objekta" is not a number issued by a register.
// Ministry clarification of 18 September 2026 (Klasa: 330-01/25-01/13,
// Ur. broj: 526-07-02-26-136) says a one-location seller without an
// internal code may choose a label such as P-01, NP, or 01. None has
// been chosen, so the identifier stays empty.
//
// "Oblik prodajnog objekta" is illustrated ("npr. prodavaonica"), not
// given as a closed list or a required webshop token. It stays empty.

import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'

export const CONFIRMED_WEBSHOP_LEGAL_NAME = 'Luroni Gaja d.o.o.'
export const CONFIRMED_WEBSHOP_ADDRESS = 'Gornja Švarča 19, 47000 Karlovac'
export const CONFIRMED_WEBSHOP_COUNTRY = 'Croatia'

export const CONFIRMED_OUTLET_FORM: string | null = null
export const CONFIRMED_OUTLET_IDENTIFIER: string | null = null

export type ConfirmedPriceListOutlet = {
  /** Filename token for the outlet type. Not "prodavaonica": there is no shop. */
  form: string
  /** Postal address confirmed as the regulatory sales outlet. */
  address: string
  /** Trader-chosen outlet label. Not an invented or registered code. */
  identifier: string
}

export const CONFIRMED_PRICE_LIST_OUTLET: ConfirmedPriceListOutlet | null =
  CONFIRMED_OUTLET_FORM && CONFIRMED_OUTLET_IDENTIFIER
    ? {
        form: CONFIRMED_OUTLET_FORM,
        address: CONFIRMED_WEBSHOP_ADDRESS,
        identifier: CONFIRMED_OUTLET_IDENTIFIER,
      }
    : null

/**
 * The 18 September 2026 clarification ties dostupno to physical stock at
 * the outlet. These bouquets are made to order, so that word is not used.
 * "nedostupno" is also unconfirmed, because the bouquets are offered for sale.
 */
export const AVAILABILITY_LEGAL_VALUE_CONFIRMED = false

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
