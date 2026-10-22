'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  CONSENT_OPEN_EVENT,
  applyGtagConsent,
  clearMarketingCookies,
  clearOptionalTrackingCookies,
  getConsentServerSnapshot,
  getConsentSnapshot,
  persistConsent,
  subscribeConsent,
  type CookieConsent,
} from '@/lib/cookieConsent'

type CookieConsentContextValue = {
  consent: CookieConsent | null
  hydrated: boolean
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  saveConsent: (next: CookieConsent) => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

function subscribeAlwaysMounted() {
  return () => {}
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  )
  const hydrated = useSyncExternalStore(
    subscribeAlwaysMounted,
    () => true,
    () => false,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setSettingsOpen(true)
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  const saveConsent = useCallback((next: CookieConsent) => {
    persistConsent(next)
    setSettingsOpen(false)

    applyGtagConsent(next)

    if (!next.analytics) {
      clearOptionalTrackingCookies()
      window.gtag = undefined
    } else if (!next.marketing) {
      clearMarketingCookies()
    }
  }, [])

  const value = useMemo(
    () => ({ consent, hydrated, settingsOpen, setSettingsOpen, saveConsent }),
    [consent, hydrated, settingsOpen, saveConsent],
  )

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider')
  }
  return context
}
