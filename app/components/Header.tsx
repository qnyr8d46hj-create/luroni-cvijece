'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/',           label: 'Početna' },
  { href: '/#bouquets',  label: 'Složeni buketi' },
  { href: '/#sizes',     label: 'Veličine' },
  { href: '/#order',     label: 'Narudžba' },
  { href: '/#contact',   label: 'Kontakt' },
]

const CITY_LINKS = [
  { href: '/dostava-cvijeca-rijeka', label: 'Dostava cvijeća Rijeka' },
  { href: '/cvjecarna-krk',          label: 'Dostava cvijeća Krk' },
]

function isHomeSectionHref(href: string) {
  return href === '/' || href.startsWith('/#')
}

function goToHomeSection(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (typeof window === 'undefined' || window.location.pathname !== '/') {
    return
  }

  if (!isHomeSectionHref(href)) {
    return
  }

  event.preventDefault()

  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : ''
  window.history.replaceState(null, '', hash ? `/#${hash}` : '/')

  if (hash) {
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export function Header() {
  const [open, setOpen] = useState(false)

  function onNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    setOpen(false)
    goToHomeSection(event, href)
  }

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-divider">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link
            href="/"
            onClick={(event) => onNavClick(event, '/')}
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
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:block min-w-0" aria-label="Navigacija">
            <ul className="flex items-center justify-end gap-0.5 xl:gap-1 flex-wrap">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(event) => onNavClick(event, link.href)}
                    className="px-2.5 xl:px-4 py-1.5 text-[0.8125rem] xl:text-sm font-medium text-muted rounded-full hover:text-forest hover:bg-forest-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li aria-hidden="true" className="mx-1.5 h-4 w-px bg-divider" />
              {CITY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(event) => onNavClick(event, link.href)}
                    className="px-2.5 xl:px-4 py-1.5 text-[0.8125rem] xl:text-sm font-medium text-muted rounded-full hover:text-forest hover:bg-forest-light transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/#order"
              onClick={(event) => onNavClick(event, '/#order')}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2 rounded-full bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors"
            >
              Naruči buket
            </Link>

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
          <ul className="flex flex-col gap-1 mb-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(event) => onNavClick(event, link.href)}
                  className="block px-4 py-3 text-base font-medium text-ink rounded-xl hover:text-forest hover:bg-forest-light transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="px-4 pt-2 pb-1 text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-muted">
            Dostava
          </p>
          <ul className="flex flex-col gap-1 mb-4">
            {CITY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(event) => onNavClick(event, link.href)}
                  className="block px-4 py-3 text-base font-medium text-ink rounded-xl hover:text-forest hover:bg-forest-light transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#order"
            onClick={(event) => onNavClick(event, '/#order')}
            className="flex items-center justify-center w-full py-3.5 rounded-full bg-forest text-white font-medium hover:bg-forest-dark transition-colors"
          >
            Naruči buket
          </Link>
        </nav>
      )}
    </header>
  )
}
