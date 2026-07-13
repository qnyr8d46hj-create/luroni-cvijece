'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

interface PurchaseData {
  transactionId: string
  value:         number
  currency:      string
  bouquetSize:   string
  itemName:      string
  itemId:        string
}

function firePurchaseEvent(data: PurchaseData) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'purchase', {
    transaction_id: data.transactionId,
    value:          data.value,
    currency:       data.currency,
    payment_type:   'card',
    items: [
      {
        item_id:   data.itemId,
        item_name: data.itemName,
        price:     data.value,
        quantity:  1,
      },
    ],
  })
}

// ── PurchaseTracker ────────────────────────────────────────────
//
// Fires a GA4 "purchase" event exactly once per checkout session.
// Deduplication: the session_id is written to sessionStorage after
// the event fires — a page refresh within the same browser tab will
// find the flag and skip re-firing.

export function PurchaseTracker({ sessionId }: { sessionId: string | undefined }) {
  useEffect(() => {
    if (!sessionId) return

    const storageKey = `ga4_tracked_${sessionId}`
    if (sessionStorage.getItem(storageKey)) return

    async function track() {
      try {
        const res = await fetch(
          `/api/get-checkout-session?session_id=${encodeURIComponent(sessionId!)}`,
        )

        if (!res.ok) {
          console.warn(`[PurchaseTracker] API responded ${res.status} — skipping GA4 event`)
          return
        }

        const data: PurchaseData = await res.json()
        firePurchaseEvent(data)
        sessionStorage.setItem(storageKey, '1')
        console.log('[PurchaseTracker] ✓ GA4 purchase event fired', data)
      } catch (err) {
        console.error('[PurchaseTracker] Failed to track purchase:', err)
      }
    }

    track()
  }, [sessionId])

  return null
}
