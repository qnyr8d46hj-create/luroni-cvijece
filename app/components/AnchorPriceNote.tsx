'use client'

import { useSyncExternalStore } from 'react'
import { isAnchorPriceDisplayActive } from '@/lib/productPrices'

function subscribe() {
  return () => {}
}

/** Additional/anchor price. Shown only while NN_PRICE_COMPLIANCE_ENABLED is true. */
export function AnchorPriceNote({ children }: { children: string }) {
  const visible = useSyncExternalStore(
    subscribe,
    () => isAnchorPriceDisplayActive(),
    () => false,
  )

  if (!visible) return null

  return (
    <p className="text-[0.75rem] sm:text-[0.8125rem] text-muted leading-[1.45] mt-1">
      {children}
    </p>
  )
}
