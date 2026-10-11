// ── Delivery locations (shared by fresh and artificial orders) ─
//
// To add or remove a city: edit this array only.
// The selected value is saved as-is to Firestore (deliveryCity).

export const DELIVERY_CITIES = [
  'Bakar',
  'Crikvenica',
  'Čavle',
  'Dražice',
  'Hreljin',
  'Ičići',
  'Ika',
  'Jelenje',
  'Kastav',
  'Klana',
  'Kostrena',
  'Kraljevica',
  'Kukuljanovo',
  'Lovran',
  'Matulji',
  'Novi Vinodolski',
  'Opatija',
  'Otok Krk',
  'Rijeka',
  'Selce',
  'Šmrika',
  'Viškovo',
] as const

export type DeliveryCity = (typeof DELIVERY_CITIES)[number]

export function isDeliveryCity(value: string): value is DeliveryCity {
  return (DELIVERY_CITIES as readonly string[]).includes(value)
}
