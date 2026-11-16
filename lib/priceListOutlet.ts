// Regulatory outlet identity for NN 101/2026-1213 filenames.
//
// Confirmed business facts, which are NOT a chosen sales outlet:
// - Registered office: Gornja Švarča 19, 47000 Karlovac.
// - Flower warehouse, with no customer counter: Morettiev prolaz 1b, 51000 Rijeka.
// The decisions require "adresa prodajnog objekta" and do not say which of
// those addresses applies to an online-only seller. Leave this null until the
// business confirms the address, the filename word for the outlet type, and
// the outlet identifier with the competent authority or its accountant.
// Do not invent those values.

export type ConfirmedPriceListOutlet = {
  /** Filename token for the outlet type. Not "prodavaonica": there is no shop. */
  form: string
  /** Postal address confirmed as the regulatory sales outlet. */
  address: string
  /** Outlet identifier assigned by the business. Not an invented code. */
  identifier: string
}

export const CONFIRMED_PRICE_LIST_OUTLET: ConfirmedPriceListOutlet | null = null

/**
 * The decisions require dostupno/nedostupno for goods. Ministry clarification
 * of 18 September 2026 ties that word to physical stock at the outlet.
 * These bouquets are made to order, so that word is not confirmed.
 */
export const AVAILABILITY_LEGAL_VALUE_CONFIRMED = false
