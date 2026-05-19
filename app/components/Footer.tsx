const FOOTER_LINKS = [
  { href: '#top',      label: 'Početna' },
  { href: '#gallery',  label: 'Složeni buketi' },
  { href: '#bouquets', label: 'Veličine buketa' },
  { href: '#order',    label: 'Narudžba' },
  { href: '#contact',  label: 'Kontakt' },
]

export function Footer() {
  return (
    <footer className="bg-[#17271d] text-white/60" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 py-12 border-b border-white/[0.08]">

          {/* Brand */}
          <div>
            <a
              href="#top"
              className="flex items-center gap-2 font-display text-xl font-semibold text-white/90 mb-1.5"
              aria-label="Luroni cvijeće — na vrh stranice"
            >
              <FlowerIcon />
              Luroni cvijeće
            </a>
            <p className="text-sm text-white/40">online narudžba buketa s dostavom</p>
          </div>

          {/* Nav */}
          <nav aria-label="Footer navigacija">
            <ul className="flex flex-wrap gap-1">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="px-3 py-1.5 text-sm text-white/55 rounded-lg hover:text-white hover:bg-white/[0.07] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

        </div>

        <p className="py-5 text-center text-xs text-white/[0.28]">
          © 2026 Luroni cvijeće. Sva prava pridržana.
        </p>

      </div>
    </footer>
  )
}

function FlowerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C10.5 4 9 6.5 9 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0-2.5-1.5-5-3-7z" opacity={0.9} />
      <path d="M12 12C9.5 9.5 5.5 9.5 3.5 12c-1 1.2-1 3.2.5 4 1.5.8 4-.5 8-4z" opacity={0.7} />
      <path d="M12 12c2.5-2.5 6.5-2.5 8.5 0 1 1.2 1 3.2-.5 4-1.5.8-4-.5-8-4z" opacity={0.7} />
      <path d="M12 12c-1.5 2.5-1.5 6 0 8 .8 1 2.5 1.2 3.5 0 1-1.2 0-4-3.5-8z" opacity={0.6} />
      <path d="M12 12c1.5 2.5 1.5 6 0 8-.8 1-2.5 1.2-3.5 0-1-1.2 0-4 3.5-8z" opacity={0.6} />
      <circle cx="12" cy="12" r="2.2" />
    </svg>
  )
}
