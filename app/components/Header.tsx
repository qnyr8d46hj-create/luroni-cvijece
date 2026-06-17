'use client'

import { useState } from 'react'
import Image from 'next/image'

const NAV_LINKS = [
  { href: '#top',      label: 'Početna' },
  { href: '#gallery',  label: 'Složeni buketi' },
  { href: '#bouquets', label: 'Veličine' },
  { href: '#order',    label: 'Narudžba' },
  { href: '#kontakt',  label: 'Kontakt' },
]

/* ── Temporary notice bar — single config block ──────────────
   To remove the notice later: set `enabled` to false below,
   or delete this block and the <NoticeBar /> call in Header(). */
const NOTICE_BAR = {
  enabled: true,
  text: '🌸 Obavijest: Od 20.6. do 27.6. privremeno ne vršimo dostavu cvijeća. Narudžbe ponovno primamo od 28.6.',
}

function NoticeBar() {
  if (!NOTICE_BAR.enabled) return null
  return (
    <div className="bg-[#f3e9d2] text-forest-dark text-center text-xs sm:text-sm font-medium leading-snug px-4 py-2.5">
      {NOTICE_BAR.text}
    </div>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <NoticeBar />
      <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-divider">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <a
            href="#top"
            className="flex items-center flex-shrink-0 hover:opacity-85 transition-opacity duration-200"
            aria-label="Luroni cvijeće — početna"
          >
            <Image
              src="/images/branding/logo-header.png"
              alt="Luroni cvijeće"
              width={200}
              height={56}
              className="h-9 w-auto"
              preload
            />
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:block" aria-label="Navigacija">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="px-4 py-1.5 text-sm font-medium text-muted rounded-full hover:text-forest hover:bg-forest-light transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="#order"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-full bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors"
            >
              Naruči buket
            </a>

            <button
              className="lg:hidden flex flex-col items-center justify-center gap-[5px] min-w-[44px] min-h-[44px] -mr-2.5"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Zatvori izbornik' : 'Otvori izbornik'}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              <span
                className={`block w-[22px] h-0.5 bg-ink rounded-full transition-all origin-center ${
                  open ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`block w-[22px] h-0.5 bg-ink rounded-full transition-all ${
                  open ? 'opacity-0 scale-x-0' : ''
                }`}
              />
              <span
                className={`block w-[22px] h-0.5 bg-ink rounded-full transition-all origin-center ${
                  open ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav
          id="mobile-nav"
          className="lg:hidden border-t border-divider bg-cream/98 px-4 pt-3 pb-5"
          aria-label="Mobilna navigacija"
        >
          <ul className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-ink rounded-xl hover:text-forest hover:bg-forest-light transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#order"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-full py-3.5 rounded-full bg-forest text-white font-medium hover:bg-forest-dark transition-colors"
          >
            Naruči buket
          </a>
        </nav>
      )}
      </header>
    </>
  )
}
