export const CONSENT_VERSION = 1
export const CONSENT_MAX_AGE_DAYS = 365
export const CONSENT_COOKIE_NAME = 'luroni_cookie_consent'
export const CONSENT_STORAGE_KEY = 'luroni_cookie_consent'
export const CONSENT_OPEN_EVENT = 'luroni-open-cookie-settings'
export const CONSENT_CHANGED_EVENT = 'luroni-cookie-consent-changed'
export const GTAG_READY_EVENT = 'luroni-gtag-ready'

export type CookieConsent = {
  version: number
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

export type GtagConsentState = 'granted' | 'denied'

export type GtagConsentUpdate = {
  analytics_storage: GtagConsentState
  ad_storage: GtagConsentState
  ad_user_data: GtagConsentState
  ad_personalization: GtagConsentState
}

export const DEFAULT_DENIED_CONSENT_SIGNALS: GtagConsentUpdate = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

const OPTIONAL_COOKIE_NAMES = new Set([
  '_ga',
  '_gid',
  '_gat',
  '_gcl_au',
  '_gcl_aw',
  '_gcl_dc',
  '_gcl_gb',
])

const OPTIONAL_COOKIE_PREFIXES = ['_ga_', '_gat_', '_gac_', '_gcl_']

export function createConsent(choice: {
  analytics: boolean
  marketing: boolean
}): CookieConsent {
  return {
    version: CONSENT_VERSION,
    necessary: true,
    analytics: choice.analytics,
    marketing: choice.marketing,
    updatedAt: new Date().toISOString(),
  }
}

export function acceptAllConsent(): CookieConsent {
  return createConsent({ analytics: true, marketing: true })
}

export function rejectOptionalConsent(): CookieConsent {
  return createConsent({ analytics: false, marketing: false })
}

export function gtagConsentUpdate(consent: CookieConsent | null): GtagConsentUpdate {
  const analytics = consent?.analytics === true
  const marketing = consent?.marketing === true
  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  }
}

export function isConsentCurrent(consent: CookieConsent): boolean {
  if (consent.version !== CONSENT_VERSION) return false
  if (consent.necessary !== true) return false
  if (typeof consent.analytics !== 'boolean') return false
  if (typeof consent.marketing !== 'boolean') return false
  const updatedAt = Date.parse(consent.updatedAt)
  if (!Number.isFinite(updatedAt)) return false
  return Date.now() - updatedAt < CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
}

export function parseConsentCookie(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    const parsed = JSON.parse(decoded) as Partial<CookieConsent>
    const consent: CookieConsent = {
      version: Number(parsed.version),
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    }
    return isConsentCurrent(consent) ? consent : null
  } catch {
    return null
  }
}

export function isOptionalTrackingCookie(name: string): boolean {
  if (name === CONSENT_COOKIE_NAME) return false
  if (OPTIONAL_COOKIE_NAMES.has(name)) return true
  return OPTIONAL_COOKIE_PREFIXES.some(prefix => name.startsWith(prefix))
}

export function isMarketingCookie(name: string): boolean {
  return name.startsWith('_gcl_') || name.startsWith('_gac_')
}

function readRawCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(`${name}=`)) {
      return trimmed.slice(name.length + 1)
    }
  }
  return null
}

function currentStoredRaw(): string {
  if (typeof window === 'undefined') return ''
  try {
    const fromStorage = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (fromStorage) return fromStorage
  } catch {
    // Private mode can block localStorage.
  }
  return readRawCookie(CONSENT_COOKIE_NAME) ?? ''
}

const consentListeners = new Set<() => void>()
let snapshotRaw: string | undefined
let snapshotValue: CookieConsent | null = null

function emitConsentChange(): void {
  snapshotRaw = undefined
  for (const listener of consentListeners) listener()
}

export function subscribeConsent(listener: () => void): () => void {
  consentListeners.add(listener)
  return () => {
    consentListeners.delete(listener)
  }
}

export function getConsentSnapshot(): CookieConsent | null {
  const raw = currentStoredRaw()
  if (raw === snapshotRaw) return snapshotValue
  snapshotRaw = raw
  snapshotValue = parseConsentCookie(raw)
  return snapshotValue
}

export function getConsentServerSnapshot(): CookieConsent | null {
  return null
}

export function readStoredConsent(): CookieConsent | null {
  return getConsentSnapshot()
}

export function persistConsent(consent: CookieConsent): void {
  const payload = JSON.stringify(consent)
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, payload)
  } catch {
    // Ignore quota / private-mode failures; cookie is the fallback.
  }
  writeFirstPartyCookie(CONSENT_COOKIE_NAME, payload, CONSENT_MAX_AGE_DAYS)
  document.documentElement.setAttribute('data-luroni-consent', 'chosen')
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: consent }))
  emitConsentChange()
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))
}

export function applyGtagConsent(consent: CookieConsent | null): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', gtagConsentUpdate(consent))
}

export function clearOptionalTrackingCookies(): void {
  expireMatchingCookies(isOptionalTrackingCookie)
}

export function clearMarketingCookies(): void {
  expireMatchingCookies(isMarketingCookie)
}

function expireMatchingCookies(match: (name: string) => boolean): void {
  if (typeof document === 'undefined') return
  const names = document.cookie.split(';').map(part => part.split('=')[0]?.trim() ?? '')
  for (const name of names) {
    if (name && match(name)) expireCookie(name)
  }
}

function writeFirstPartyCookie(name: string, value: string, days: number): void {
  const maxAge = days * 24 * 60 * 60
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
}

function expireCookie(name: string): void {
  const expire = 'Thu, 01 Jan 1970 00:00:00 GMT'
  const host = location.hostname
  const base = `${name}=; expires=${expire}; Max-Age=0; path=/; SameSite=Lax`
  document.cookie = base
  document.cookie = `${base}; domain=${host}`
  if (host.includes('.')) {
    document.cookie = `${base}; domain=.${host}`
  }
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}
