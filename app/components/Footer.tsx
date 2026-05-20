import Image from 'next/image'

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
