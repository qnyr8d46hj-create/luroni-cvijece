'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useCookieConsent } from '@/app/components/CookieConsentProvider'
import {
  acceptAllConsent,
  createConsent,
  rejectOptionalConsent,
} from '@/lib/cookieConsent'

const primaryBtn =
  'inline-flex items-center justify-center min-h-11 px-5 py-3 rounded-full ' +
  'bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest'

const secondaryBtn =
  'inline-flex items-center justify-center min-h-11 px-5 py-3 rounded-full ' +
  'border-2 border-forest bg-cream text-forest text-sm font-medium hover:bg-forest-light transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest'

export function CookieBanner() {
  const { consent, hydrated, settingsOpen, setSettingsOpen, saveConsent } = useCookieConsent()
  const bannerRef = useRef<HTMLDivElement>(null)
  const showBanner = (!hydrated || consent === null) && !settingsOpen

  useEffect(() => {
    const node = bannerRef.current
    if (!hydrated || consent !== null || settingsOpen || !node) {
      document.documentElement.style.setProperty('--cookie-banner-h', '0px')
      return
    }

    const applyHeight = () => {
      document.documentElement.style.setProperty('--cookie-banner-h', `${node.offsetHeight}px`)
    }
    applyHeight()
    const observer = new ResizeObserver(applyHeight)
    observer.observe(node)
    return () => {
      observer.disconnect()
      document.documentElement.style.setProperty('--cookie-banner-h', '0px')
    }
  }, [hydrated, consent, settingsOpen, showBanner])

  return (
    <>
      {showBanner && (
        <div
          ref={bannerRef}
          data-cookie-banner
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-text"
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-divider bg-cream/95 backdrop-blur-sm shadow-[0_-8px_30px_rgba(26,26,26,0.08)]"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-4 sm:py-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-8">
              <div className="min-w-0 flex-1">
                <p
                  id="cookie-banner-title"
                  className="font-display text-xl sm:text-2xl font-semibold text-ink leading-snug"
                >
                  Pomozite nam da budemo još bolji 🌸
                </p>
                <p
                  id="cookie-banner-text"
                  className="mt-2 text-sm text-muted leading-[1.65] max-w-3xl"
                >
                  Koristimo kolačiće kako bismo poboljšali iskustvo kupnje, razumjeli posjećenost stranice i prikazivali relevantnije oglase. Vi odlučujete koje neobavezne kolačiće želite dopustiti.{' '}
                  <Link href="/politika-kolacica" className="text-forest hover:underline">
                    Politika kolačića
                  </Link>
                  {' · '}
                  <Link href="/politika-privatnosti" className="text-forest hover:underline">
                    Politika privatnosti
                  </Link>
                </p>
              </div>

              <div className="w-full lg:w-auto shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" className={primaryBtn} onClick={() => saveConsent(acceptAllConsent())}>
                    Prihvati sve
                  </button>
                  <button type="button" className={secondaryBtn} onClick={() => saveConsent(rejectOptionalConsent())}>
                    Odbij neobavezne
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-2 w-full text-center text-sm font-medium text-forest hover:underline underline-offset-2 py-1"
                  onClick={() => setSettingsOpen(true)}
                >
                  Postavke kolačića
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <CookieSettingsDialog
          analyticsDefault={consent?.analytics === true}
          marketingDefault={consent?.marketing === true}
          onClose={() => setSettingsOpen(false)}
          onSave={(analytics, marketing) => saveConsent(createConsent({ analytics, marketing }))}
        />
      )}
    </>
  )
}

function CookieSettingsDialog({
  analyticsDefault,
  marketingDefault,
  onClose,
  onSave,
}: {
  analyticsDefault: boolean
  marketingDefault: boolean
  onClose: () => void
  onSave: (analytics: boolean, marketing: boolean) => void
}) {
  const titleId = useId()
  const [analytics, setAnalytics] = useState(analyticsDefault)
  const [marketing, setMarketing] = useState(marketingDefault)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        aria-label="Zatvori postavke kolačića"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-lg bg-cream rounded-t-3xl sm:rounded-3xl border border-divider shadow-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="px-5 sm:px-7 pt-5 sm:pt-7 pb-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-2xl font-semibold text-ink">
              Postavke kolačića
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="text-sm text-muted hover:text-ink"
            >
              Zatvori
            </button>
          </div>
          <p className="mt-2 text-sm text-muted leading-[1.65]">
            Nužni kolačići uvijek su aktivni. Analitika i marketing nisu unaprijed odabrani.
            Promjenu privole možete učiniti u bilo koj trenutku.
          </p>

          <div className="mt-4 divide-y divide-divider border-y border-divider">
            <ConsentSwitch
              id="cookie-necessary"
              label="Nužni"
              description="Potrebni za rad web-mjesta, spremanje vašeg izbora kolačića te za narudžbu i plaćanje. Ne mogu se isključiti."
              checked
              disabled
            />
            <ConsentSwitch
              id="cookie-analytics"
              label="Analitika"
              description="Google Analytics 4 te Vercel Analytics i Speed Insights. Pomažu nam razumjeti posjete web-mjesta. Isključeno dok ne date privolu."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ConsentSwitch
              id="cookie-marketing"
              label="Marketing"
              description="Google oglasni signali (Consent Mode) ako je analitika također odobrena. Na web-mjestu nije instaliran zaseban Google Ads piksel. Isključeno dok ne date privolu."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" className={primaryBtn} onClick={() => onSave(true, true)}>
              Prihvati sve
            </button>
            <button type="button" className={secondaryBtn} onClick={() => onSave(false, false)}>
              Odbij neobavezne
            </button>
          </div>
          <button
            type="button"
            className="mt-2 w-full inline-flex items-center justify-center min-h-11 px-5 py-3 rounded-full border border-divider text-ink text-sm font-medium hover:bg-white transition-colors"
            onClick={() => onSave(analytics, marketing)}
          >
            Spremi postavke
          </button>
        </div>
      </div>
    </div>
  )
}

function ConsentSwitch({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-ink">
          {label}
        </p>
        <p id={`${id}-desc`} className="mt-1 text-sm text-muted leading-[1.6]">
          {description}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-desc`}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ' +
          (checked ? 'bg-forest' : 'bg-[#d4cfc6]') +
          (disabled ? ' opacity-70 cursor-not-allowed' : '')
        }
      >
        <span
          className={
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ' +
            (checked ? 'translate-x-5' : '')
          }
        />
      </button>
    </div>
  )
}
