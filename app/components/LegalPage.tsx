import { Header } from './Header'
import { Footer } from './Footer'

const COMPANY = {
  name:    'Luroni Gaja d.o.o.',
  address: 'Gornja Švarča 19, 47000 Karlovac',
  oib:     '89564174048',
  email:   'info@luroni.hr',
  phone:   '+385 99 866 3592',
}

// ── Typography sub-components ───────────────────────────────────

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="mt-10 sm:mt-12">
      <h2
        id={id}
        className="font-display text-[1.5rem] sm:text-[1.625rem] font-semibold text-ink mb-4 pb-3 border-b border-divider leading-snug"
      >
        {title}
      </h2>
      <div className="space-y-3.5">{children}</div>
    </section>
  )
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.9375rem] text-muted leading-[1.75]">{children}</p>
  )
}

export function LegalUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-1.5 text-[0.9375rem] text-muted leading-[1.75]">
      {children}
    </ul>
  )
}

// ── Full page wrapper ───────────────────────────────────────────

export function LegalPage({
  title,
  subtitle,
  updatedAt = 'Srpanj 2026.',
  children,
}: {
  title: string
  subtitle?: string
  updatedAt?: string
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="bg-cream min-h-screen">

        {/* Hero */}
        <div className="border-b border-divider">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-forest mb-3">
              Luroni cvijeće
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink leading-[1.1] mb-4">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[1.0625rem] text-muted leading-[1.65] max-w-xl mt-3">
                {subtitle}
              </p>
            )}
            <p className="mt-5 text-sm text-faint">Zadnje ažuriranje: {updatedAt}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-20">
          {children}

          {/* Registered company info footer block */}
          <div className="mt-16 pt-8 border-t border-divider">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-faint mb-4">
              Podaci o tvrtki
            </p>
            <dl className="space-y-1.5 text-sm text-muted">
              <div>
                <dt className="inline font-medium text-ink">Naziv: </dt>
                <dd className="inline">{COMPANY.name}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">OIB: </dt>
                <dd className="inline">{COMPANY.oib}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">Adresa: </dt>
                <dd className="inline">{COMPANY.address}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">E-mail: </dt>
                <dd className="inline">
                  <a href={`mailto:${COMPANY.email}`} className="text-forest hover:underline">
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-ink">Telefon: </dt>
                <dd className="inline">
                  <a href="tel:+385998663592" className="text-forest hover:underline">
                    {COMPANY.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
