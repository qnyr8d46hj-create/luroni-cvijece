'use client'

import Script from 'next/script'

/**
 * Injects the GA4 gtag scripts after the page becomes interactive.
 * Rendered only when gaId is truthy (i.e. in production with the env var set).
 * Uses next/script "afterInteractive" strategy — non-blocking, hydration-safe.
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}
