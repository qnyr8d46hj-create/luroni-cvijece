import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  CONSENT_COOKIE_NAME,
  CONSENT_VERSION,
  DEFAULT_DENIED_CONSENT_SIGNALS,
  acceptAllConsent,
  createConsent,
  gtagConsentUpdate,
  isMarketingCookie,
  isOptionalTrackingCookie,
  parseConsentCookie,
  rejectOptionalConsent,
} from '../lib/cookieConsent'
import { ga4PurchaseFromCheckoutSession } from '../lib/ga4Purchase'

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}
function assert(condition: unknown, message: string) {
  if (!condition) fail(message)
}

const root = process.cwd()
function read(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

const analyticsOnly = createConsent({ analytics: true, marketing: false })
const marketingOnly = createConsent({ analytics: false, marketing: true })
const accepted = acceptAllConsent()
const rejected = rejectOptionalConsent()

assert(accepted.necessary === true && accepted.analytics && accepted.marketing, 'Accept all grants both optional categories')
assert(!rejected.analytics && !rejected.marketing && rejected.necessary === true, 'Reject keeps necessary and denies optional')
assert(analyticsOnly.analytics && !analyticsOnly.marketing, 'Analytics does not imply marketing')
assert(!marketingOnly.analytics && marketingOnly.marketing, 'Marketing can be stored independently')
assert(accepted.version === CONSENT_VERSION, 'Consent version is current')

const denied = gtagConsentUpdate(null)
assert(
  denied.analytics_storage === 'denied' &&
  denied.ad_storage === 'denied' &&
  denied.ad_user_data === 'denied' &&
  denied.ad_personalization === 'denied',
  'Null consent maps to denied Consent Mode signals',
)
assert(
  JSON.stringify(denied) === JSON.stringify(DEFAULT_DENIED_CONSENT_SIGNALS),
  'Default denied signals match the exported constant',
)

const analyticsSignals = gtagConsentUpdate(analyticsOnly)
assert(analyticsSignals.analytics_storage === 'granted', 'Analytics consent grants analytics_storage')
assert(
  analyticsSignals.ad_storage === 'denied' &&
  analyticsSignals.ad_user_data === 'denied' &&
  analyticsSignals.ad_personalization === 'denied',
  'Analytics-only consent does not grant advertising signals',
)

const allSignals = gtagConsentUpdate(accepted)
assert(
  allSignals.analytics_storage === 'granted' &&
  allSignals.ad_storage === 'granted' &&
  allSignals.ad_user_data === 'granted' &&
  allSignals.ad_personalization === 'granted',
  'Accept all grants Consent Mode v2 optional signals',
)

assert(parseConsentCookie(null) === null, 'Empty cookie parses as null')
assert(parseConsentCookie('not-json') === null, 'Invalid cookie parses as null')
assert(parseConsentCookie(JSON.stringify(accepted))?.analytics === true, 'Valid consent round-trips')
assert(
  parseConsentCookie(JSON.stringify({ ...accepted, version: 0 })) === null,
  'Old consent version is rejected',
)

assert(isOptionalTrackingCookie('_ga'), '_ga is optional')
assert(isOptionalTrackingCookie('_ga_ABC123'), '_ga_* is optional')
assert(isOptionalTrackingCookie('_gid'), '_gid is optional')
assert(isOptionalTrackingCookie('_gcl_au'), '_gcl_au is optional')
assert(!isOptionalTrackingCookie(CONSENT_COOKIE_NAME), 'Consent cookie is not optional')
assert(isMarketingCookie('_gcl_au') && isMarketingCookie('_gac_GB'), 'Ads cookies are marketing')
assert(!isMarketingCookie('_ga'), 'GA cookie is not classified as marketing-only')

const purchase = ga4PurchaseFromCheckoutSession(
  {
    id: 'cs_test_1',
    payment_intent: 'pi_test_1',
    amount_total: 5500,
    metadata: { bouquetSize: 'M' },
  },
  { S: 45, M: 55, L: 70 },
)
assert(!('error' in purchase), 'Fresh purchase payload maps')
if (!('error' in purchase)) {
  assert(purchase.transactionId === 'pi_test_1', 'Purchase keeps transaction id')
  assert(purchase.value === 55, 'Purchase keeps value')
  assert(purchase.currency === 'EUR', 'Purchase keeps currency')
  assert(purchase.itemId === 'buket-m', 'Purchase keeps item id')
}

const layout = read('app/layout.tsx')
assert(!layout.includes('<Analytics />'), 'Root layout does not load Vercel Analytics unconditionally')
assert(!layout.includes('<SpeedInsights />'), 'Root layout does not load Speed Insights unconditionally')
assert(layout.includes('ConsentedTelemetry'), 'Root layout gates telemetry behind consent')
assert(layout.includes('CookieBanner'), 'Root layout renders the cookie banner')
assert(layout.includes("strategy=\"beforeInteractive\""), 'Consent boot script is beforeInteractive')
assert(!layout.includes('GoogleAnalytics'), 'GA4 is not imported in the root layout')

const telemetry = read('app/components/ConsentedTelemetry.tsx')
assert(telemetry.includes('consent?.analytics'), 'Telemetry requires analytics consent')
assert(telemetry.includes('<Analytics />') && telemetry.includes('<SpeedInsights />'), 'Vercel scripts are analytics-gated')

const ga = read('app/components/GoogleAnalytics.tsx')
assert(ga.includes("analytics_storage: 'denied'"), 'GA4 sets Consent Mode default denied')
assert(ga.includes('ad_user_data'), 'GA4 includes ad_user_data')
assert(ga.includes('ad_personalization'), 'GA4 includes ad_personalization')
assert(ga.includes('consent.analytics'), 'GA4 component requires analytics consent')
assert(!ga.includes('gtag/js') || ga.includes('consent.analytics') || ga.includes('safeGaId'), 'gtag.js is only in the consented GA component')

const tracker = read('app/components/PurchaseTracker.tsx')
assert(tracker.includes("transaction_id: data.transactionId"), 'Purchase event keeps transaction_id')
assert(tracker.includes('value:          data.value') || tracker.includes('value: data.value'), 'Purchase event keeps value')
assert(tracker.includes('currency:       data.currency') || tracker.includes('currency: data.currency'), 'Purchase event keeps currency')
assert(tracker.includes('items:'), 'Purchase event keeps items')
assert(tracker.includes('analyticsAllowed'), 'Purchase tracking waits for analytics consent')
assert(tracker.includes("sessionStorage.setItem(storageKey, '1')"), 'Tracked flag is still used')
assert(
  tracker.indexOf('firePurchaseEvent(data)') < tracker.indexOf("sessionStorage.setItem(storageKey, '1')"),
  'Purchase is marked tracked only after the gtag call',
)

const orderForm = read('app/components/OrderForm.tsx')
assert(orderForm.includes("addDoc"), 'Fresh checkout still writes Firestore')
assert(orderForm.includes('/api/create-checkout-session'), 'Fresh checkout still creates Stripe sessions')
assert(orderForm.includes("window.gtag"), 'begin_checkout still no-ops without gtag')

const artificialForm = read('app/components/ArtificialOrderForm.tsx')
assert(artificialForm.includes('/api/create-artificial-order'), 'Artificial checkout path is unchanged')
assert(artificialForm.includes("window.gtag"), 'Artificial begin_checkout still no-ops without gtag')

const footer = read('app/components/Footer.tsx')
assert(footer.includes('CookieSettingsLink'), 'Footer has a persistent cookie settings control')

const cookiePolicy = read('app/politika-kolacica/page.tsx')
assert(cookiePolicy.includes('luroni-cvijece.com'), 'Cookie policy uses the live domain')
assert(cookiePolicy.includes('nije instaliran zaseban Google Ads piksel'), 'Cookie policy does not invent an Ads pixel')
assert(cookiePolicy.includes('Vercel Analytics'), 'Cookie policy lists Vercel Analytics')
assert(cookiePolicy.includes('Prihvati sve'), 'Cookie policy describes Accept all')

const privacy = read('app/politika-privatnosti/page.tsx')
assert(privacy.includes('privola – čl. 6. st. 1. toč. (a) GDPR'), 'Privacy policy uses consent for analytics')
assert(!privacy.includes('Google Analytics): legitimni interes'), 'Privacy policy no longer claims legitimate interest for GA')
assert(privacy.includes('nije ugrađen zaseban Ads piksel'), 'Privacy policy does not claim a standalone Ads pixel')

assert(existsSync(resolve(root, 'app/components/CookieBanner.tsx')), 'Cookie banner exists')
assert(existsSync(resolve(root, 'lib/cookieConsent.ts')), 'Consent helper exists')

console.log('OK: cookie consent checks passed')
