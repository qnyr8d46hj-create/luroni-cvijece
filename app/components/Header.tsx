'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function orderHref(pathname: string): string {
  return pathname === '/buketi' ? '/buketi#order' : '/#order'
}

function NavItem({
  href,
  className,
  onClick,
  children,
}: {
  href: string
  className: string
  onClick?: () => void
  children: React.ReactNode
}) {
  if (href.includes('#')) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}

function navLinks(pathname: string) {
  return [
    { href: '/',              label: 'Početna' },
    { href: '/#gallery',      label: 'Složeni buketi' },
    { href: '/buketi',        label: 'Buketi' },
    { href: orderHref(pathname), label: 'Narudžba' },
    { href: '/#kontakt',      label: 'Kontakt' },
  ]
}

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ''
  const links = navLinks(pathname)
  const ctaHref = orderHref(pathname)

  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-divider">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link
            href="/"
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
          <nav className="hidden lg:block" aria-label="Navigacija">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.label}>
                  <NavItem
                    href={link.href}
                    className="px-4 py-1.5 text-sm font-medium text-muted rounded-full hover:text-forest hover:bg-forest-light transition-colors"
                  >
                    {link.label}
                  </NavItem>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <a
              href={ctaHref}
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
            {links.map((link) => (
              <li key={link.label}>
                <NavItem
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-base font-medium text-ink rounded-xl hover:text-forest hover:bg-forest-light transition-colors"
                >
                  {link.label}
                </NavItem>
              </li>
            ))}
          </ul>
          <a
            href={ctaHref}
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
