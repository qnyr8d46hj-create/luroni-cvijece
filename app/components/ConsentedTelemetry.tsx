'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/app/components/GoogleAnalytics'
import { useCookieConsent } from '@/app/components/CookieConsentProvider'

export function ConsentedTelemetry({ gaId }: { gaId?: string }) {
  const { consent } = useCookieConsent()

  if (!consent?.analytics) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {gaId ? <GoogleAnalytics gaId={gaId} consent={consent} /> : null}
    </>
  )
}
