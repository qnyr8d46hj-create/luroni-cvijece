import { isAnchorPriceDisplayActive } from '@/lib/productPrices'

/** Reference price. Rendered on the server while NN_PRICE_COMPLIANCE_ENABLED is true. */
export function AnchorPriceNote({ children }: { children: string }) {
  if (!isAnchorPriceDisplayActive()) return null

  return (
    <p className="text-[0.75rem] sm:text-[0.8125rem] text-muted leading-[1.45] mt-1">
      {children}
    </p>
  )
}
