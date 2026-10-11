/** Server-side flag. Unset, empty, or any value other than "true" means disabled. */
export const ARTIFICIAL_CHECKOUT_ENV = 'ARTIFICIAL_CHECKOUT_ENABLED'

export const ARTIFICIAL_CHECKOUT_DISABLED_NOTICE =
  'Naručivanje umjetnih aranžmana trenutačno nije otvoreno. Katalog je vidljiv; svježi buketi se i dalje naručuju na početnoj stranici.'

export function isArtificialCheckoutEnabled(): boolean {
  return process.env.ARTIFICIAL_CHECKOUT_ENABLED === 'true'
}
