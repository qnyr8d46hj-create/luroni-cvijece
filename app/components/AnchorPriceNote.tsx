import { isAnchorPriceDisplayActive } from '@/lib/productPrices'

/**
 * Reference price. Server components omit `enabled` and follow
 * NN_PRICE_COMPLIANCE_ENABLED. Client components pass the boolean the
 * server already read, because that variable is not available in the browser.
 */
export function AnchorPriceNote({
  children,
  enabled,
}: {
  children?: string
  enabled?: boolean
}) {
  if (!(enabled ?? isAnchorPriceDisplayActive())) return null
  if (!children) return null

  return (
    <p className="text-[0.75rem] sm:text-[0.8125rem] text-muted leading-[1.45] mt-1">
      {children}
    </p>
  )
}
