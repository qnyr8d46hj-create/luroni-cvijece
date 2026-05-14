'use client'

import { useState } from 'react'

const NAV_LINKS = [
  { href: '#top',      label: 'Početna' },
  { href: '#gallery',  label: 'Složeni buketi' },
  { href: '#bouquets', label: 'Veličine' },
  { href: '#order',    label: 'Narudžba' },
  { href: '#contact',  label: 'Kontakt' },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-divider">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <a
            href="#top"
            className="flex items-center gap-2 font-display text-xl font-semibold text-forest flex-shrink-0"
            aria-label="Luroni cvijeće — početna"
          >
            <FlowerIcon />
            <span>Luroni cvijeće</span>
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
              className="lg:hidden flex flex-col justify-center gap-[5px] p-1.5 -mr-1"
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
  )
}

function FlowerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C10.5 4 9 6.5 9 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0-2.5-1.5-5-3-7z" opacity={0.9} />
      <path d="M12 12C9.5 9.5 5.5 9.5 3.5 12c-1 1.2-1 3.2.5 4 1.5.8 4-.5 8-4z" opacity={0.7} />
      <path d="M12 12c2.5-2.5 6.5-2.5 8.5 0 1 1.2 1 3.2-.5 4-1.5.8-4-.5-8-4z" opacity={0.7} />
      <path d="M12 12c-1.5 2.5-1.5 6 0 8 .8 1 2.5 1.2 3.5 0 1-1.2 0-4-3.5-8z" opacity={0.6} />
      <path d="M12 12c1.5 2.5 1.5 6 0 8-.8 1-2.5 1.2-3.5 0-1-1.2 0-4 3.5-8z" opacity={0.6} />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  )
}
