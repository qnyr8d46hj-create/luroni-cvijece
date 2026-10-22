'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import {
  GTAG_READY_EVENT,
  gtagConsentUpdate,
  type CookieConsent,
} from '@/lib/cookieConsent'

function safeGaId(gaId: string): string {
  return gaId.replace(/[^A-Z0-9-]/gi, '')
}

/**
 * Loads GA4 only after analytics consent. Consent Mode v2 defaults are denied
 * in the same tick, then updated to the saved choice before gtag config.
 * Marketing signals stay denied unless marketing consent is also granted.
 */
export function GoogleAnalytics({
  gaId,
  consent,
}: {
  gaId: string
  consent: CookieConsent
}) {
  const id = safeGaId(gaId)
  const signals = gtagConsentUpdate(consent)

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('consent', 'update', gtagConsentUpdate(consent))
  }, [consent])

  if (!id || !consent.analytics) return null

  return (
    <>
      <Script id="ga4-consent-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
          gtag('consent', 'update', {
            analytics_storage: '${signals.analytics_storage}',
            ad_storage: '${signals.ad_storage}',
            ad_user_data: '${signals.ad_user_data}',
            ad_personalization: '${signals.ad_personalization}'
          });
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
        onLoad={() => {
          window.dispatchEvent(new Event(GTAG_READY_EVENT))
        }}
      />
    </>
  )
}
