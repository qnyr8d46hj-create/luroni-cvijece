'use client'

import { useEffect } from 'react'
import { useCookieConsent } from '@/app/components/CookieConsentProvider'
import { GTAG_READY_EVENT } from '@/lib/cookieConsent'

interface PurchaseData {
  transactionId: string
  value:         number
  currency:      string
  bouquetSize:   string
  itemName:      string
  itemId:        string
}

function firePurchaseEvent(data: PurchaseData): boolean {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false

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
  return true
}

// ── PurchaseTracker ────────────────────────────────────────────
//
// Fires a GA4 "purchase" event exactly once per checkout session,
// and only after analytics consent plus a real gtag function.
// The session_id is written to sessionStorage only after the event
// is handed to gtag — a page refresh will then skip re-firing.

export function PurchaseTracker({ sessionId }: { sessionId: string | undefined }) {
  const { consent } = useCookieConsent()
  const analyticsAllowed = consent?.analytics === true

  useEffect(() => {
    if (!sessionId || !analyticsAllowed) return

    const storageKey = `ga4_tracked_${sessionId}`
    if (sessionStorage.getItem(storageKey)) return

    let cancelled = false
    let inFlight = false

    async function track(): Promise<boolean> {
      if (cancelled || inFlight) return false
      if (typeof window.gtag !== 'function') return false
      if (sessionStorage.getItem(storageKey)) return true

      inFlight = true
      try {
        const res = await fetch(
          `/api/get-checkout-session?session_id=${encodeURIComponent(sessionId!)}`,
        )

        if (!res.ok) {
          console.warn(`[PurchaseTracker] API responded ${res.status} — skipping GA4 event`)
          return false
        }

        const data: PurchaseData = await res.json()
        if (cancelled) return false
        if (typeof window.gtag !== 'function') return false

        const sent = firePurchaseEvent(data)
        if (!sent) return false

        sessionStorage.setItem(storageKey, '1')
        console.log('[PurchaseTracker] ✓ GA4 purchase event fired', data)
        return true
      } catch (err) {
        console.error('[PurchaseTracker] Failed to track purchase:', err)
        return false
      } finally {
        inFlight = false
      }
    }

    const attempt = async () => {
      if (await track()) {
        window.clearInterval(interval)
        window.clearTimeout(timeout)
      }
    }

    void attempt()
    const onReady = () => { void attempt() }
    window.addEventListener(GTAG_READY_EVENT, onReady)
    const interval = window.setInterval(() => { void attempt() }, 400)
    const timeout = window.setTimeout(() => window.clearInterval(interval), 15000)

    return () => {
      cancelled = true
      window.removeEventListener(GTAG_READY_EVENT, onReady)
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [sessionId, analyticsAllowed])

  return null
}
