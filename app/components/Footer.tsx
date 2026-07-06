import Image from 'next/image'
import Link from 'next/link'

const FOOTER_LINKS = [
  { href: '#top',      label: 'Početna' },
  { href: '#gallery',  label: 'Složeni buketi' },
  { href: '#bouquets', label: 'Veličine buketa' },
  { href: '#order',    label: 'Narudžba' },
  { href: '#kontakt',  label: 'Kontakt' },
]

const LEGAL_LINKS = [
  { href: '/opci-uvjeti',            label: 'Opći uvjeti' },
  { href: '/politika-privatnosti',   label: 'Politika privatnosti' },
  { href: '/politika-kolacica',      label: 'Politika kolačića' },
  { href: '/dostava-i-placanje',     label: 'Dostava i plaćanje' },
  { href: '/reklamacije-i-povrati',  label: 'Reklamacije i povrati' },
]

const navLinkCls =
  'block py-1.5 text-sm text-white/55 hover:text-white transition-colors'

export function Footer() {
  return (
    <footer className="bg-[#17271d] text-white/60" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <div className="flex flex-col sm:flex-row items-start justify-between gap-10 py-12 border-b border-white/[0.08]">

          {/* Brand */}
          <div className="shrink-0">
            <a
              href="#top"
              className="inline-block mb-2 hover:opacity-80 transition-opacity duration-200"
              aria-label="Luroni cvijeće — na vrh stranice"
            >
              <Image
                src="/images/branding/logo-footer.png"
                alt="Luroni cvijeće"
                width={320}
                height={100}
                className="h-14 w-auto sm:h-20"
              />
            </a>
            <p className="text-sm text-white/40">online narudžba buketa s dostavom</p>
          </div>

          {/* Nav columns */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-14">

            {/* Navigacija */}
            <nav aria-label="Footer navigacija">
              <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-white/30 mb-3">
                Navigacija
              </p>
              <ul className="space-y-0.5">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className={navLinkCls}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Pravno */}
            <nav aria-label="Pravno">
              <p className="text-[0.6875rem] font-semibold tracking-[0.12em] uppercase text-white/30 mb-3">
                Pravno
              </p>
              <ul className="space-y-0.5">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={navLinkCls}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

          </div>
        </div>

        <p className="py-5 text-center text-xs text-white/[0.28]">
          © 2026 Luroni cvijeće. Sva prava pridržana.
        </p>

      </div>
    </footer>
  )
}
