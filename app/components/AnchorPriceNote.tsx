import { isAnchorPriceDisplayActive } from '@/lib/productPrices'

/**
 * Reference price.
 * Server components omit `active` and follow NN_PRICE_COMPLIANCE_ENABLED.
 * Client components pass the flag the server already read, because the
 * browser bundle cannot see that environment variable.
 */
export function AnchorPriceNote({
  children,
  active,
}: {
  children: string
  active?: boolean
}) {
  const show = active ?? isAnchorPriceDisplayActive()
  if (!show) return null

  return (
    <p className="text-[0.75rem] sm:text-[0.8125rem] text-muted leading-[1.45] mt-1">
      {children}
    </p>
  )
}
