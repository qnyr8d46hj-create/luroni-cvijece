import type { Metadata } from 'next'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { listPriceListSnapshots } from '@/lib/priceListArchive'
import {
  ANCHOR_PRICE_LABEL,
  CUSTOM_BOUQUET,
  STANDARD_BOUQUETS,
  formatEuro,
  formatEuroRange,
} from '@/lib/productPrices'

export const dynamic = 'force-dynamic'

const PAGE_URL = 'https://www.luroni-cvijece.com/cjenik'

export const metadata: Metadata = {
  title:       'Cjenik | Luroni Cvijeće',
  description: 'Važeći cjenik buketa Luroni Cvijeće, uključujući strojno čitljivi CSV prema NN 101/2026.',
  alternates:  { canonical: PAGE_URL },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         PAGE_URL,
    siteName:    'Luroni Cvijeće',
    title:       'Cjenik | Luroni Cvijeće',
    description: 'Važeći cjenik buketa Luroni Cvijeće, uključujući strojno čitljivi CSV prema NN 101/2026.',
  },
}

const humanRows = [
  {
    name:   STANDARD_BOUQUETS.S.name,
    code:   STANDARD_BOUQUETS.S.code,
    price:  formatEuro(STANDARD_BOUQUETS.S.currentEur),
    anchor: formatEuro(STANDARD_BOUQUETS.S.anchorEur),
  },
  {
    name:   STANDARD_BOUQUETS.M.name,
    code:   STANDARD_BOUQUETS.M.code,
    price:  formatEuro(STANDARD_BOUQUETS.M.currentEur),
    anchor: formatEuro(STANDARD_BOUQUETS.M.anchorEur),
  },
  {
    name:   STANDARD_BOUQUETS.L.name,
    code:   STANDARD_BOUQUETS.L.code,
    price:  formatEuro(STANDARD_BOUQUETS.L.currentEur),
    anchor: formatEuro(STANDARD_BOUQUETS.L.anchorEur),
  },
  {
    name:   CUSTOM_BOUQUET.name,
    code:   CUSTOM_BOUQUET.codePrefix,
    price:  formatEuroRange(CUSTOM_BOUQUET.currentMinEur, CUSTOM_BOUQUET.currentMaxEur),
    anchor: formatEuroRange(CUSTOM_BOUQUET.anchorMinEur, CUSTOM_BOUQUET.anchorMaxEur),
  },
]

export default async function CjenikPage() {
  let archives: Awaited<ReturnType<typeof listPriceListSnapshots>> = []
  let archiveError = false
  try {
    archives = await listPriceListSnapshots()
  } catch (err) {
    console.error('[cjenik] archive listing failed:', err)
    archiveError = true
  }

  return (
    <>
      <Header />
      <main className="bg-cream min-h-screen">
        <div className="border-b border-divider">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-forest mb-3">
              Luroni cvijeće
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink leading-[1.1] mb-4">
              Cjenik
            </h1>
            <p className="text-[1.0625rem] text-muted leading-[1.65] max-w-2xl">
              Važeće maloprodajne cijene buketa s uključenom dostavom. Cijene su u eurima (EUR)
              i uključuju PDV.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 sm:px-8 pb-20">
          <section className="mt-10 sm:mt-12" aria-labelledby="vazeci-cjenik">
            <h2
              id="vazeci-cjenik"
              className="font-display text-[1.5rem] sm:text-[1.625rem] font-semibold text-ink mb-4 pb-3 border-b border-divider leading-snug"
            >
              Važeće cijene
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm text-ink border-collapse">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="py-3 pr-4 font-semibold">Naziv</th>
                    <th className="py-3 pr-4 font-semibold">Šifra</th>
                    <th className="py-3 pr-4 font-semibold">Maloprodajna cijena</th>
                    <th className="py-3 pr-4 font-semibold">{ANCHOR_PRICE_LABEL}</th>
                    <th className="py-3 font-semibold">Dostupnost</th>
                  </tr>
                </thead>
                <tbody>
                  {humanRows.map(row => (
                    <tr key={row.code} className="border-b border-divider/80">
                      <td className="py-3 pr-4 font-medium">{row.name}</td>
                      <td className="py-3 pr-4 text-muted font-mono text-[0.8125rem]">{row.code}</td>
                      <td className="py-3 pr-4 font-semibold text-forest">{row.price}</td>
                      <td className="py-3 pr-4 text-muted">{row.anchor}</td>
                      <td className="py-3 text-muted">Dostupno</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted leading-[1.65]">
              Buket po želji naručuje se u koracima od {CUSTOM_BOUQUET.currentStepEur}&nbsp;€
              ({CUSTOM_BOUQUET.currentMinEur}–{CUSTOM_BOUQUET.currentMaxEur}&nbsp;€).
              Dostava je besplatna i nije zasebna stavka.
            </p>
          </section>

          <section className="mt-12 sm:mt-16" aria-labelledby="strojno-cjenik">
            <h2
              id="strojno-cjenik"
              className="font-display text-[1.5rem] sm:text-[1.625rem] font-semibold text-ink mb-4 pb-3 border-b border-divider leading-snug"
            >
              Strojno čitljivi cjenik
            </h2>
            <p className="text-[0.9375rem] text-muted leading-[1.75] mb-5">
              Sukladno NN 101/2026, važeći cjenik dostupan je i u strojno čitljivom CSV
              formatu. Objavljeni cjenici dostupni su 30 dana.
            </p>
            <a
              href="/cjenik/aktualni.csv"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-forest text-white font-medium text-[0.9375rem] transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-md"
            >
              Preuzmi aktualni CSV
            </a>
            <p className="mt-3 text-sm text-faint">
              Stabilni URL:{' '}
              <a href="/cjenik/aktualni.csv" className="text-forest underline-offset-2 hover:underline">
                https://www.luroni-cvijece.com/cjenik/aktualni.csv
              </a>
            </p>
          </section>

          <section className="mt-12 sm:mt-16" aria-labelledby="arhiva-cjenik">
            <h2
              id="arhiva-cjenik"
              className="font-display text-[1.5rem] sm:text-[1.625rem] font-semibold text-ink mb-4 pb-3 border-b border-divider leading-snug"
            >
              Arhiva (30 dana)
            </h2>
            {archiveError ? (
              <p className="text-[0.9375rem] text-muted leading-[1.75]">
                Arhiva dnevnih datoteka trenutno nije dostupna. Aktualni CSV i dalje možete preuzeti gore.
              </p>
            ) : archives.length === 0 ? (
              <p className="text-[0.9375rem] text-muted leading-[1.75]">
                Dnevne datoteke pojavljuju se nakon prve objave za tekući radni dan
                (najkasnije do 8:00, Europe/Zagreb).
              </p>
            ) : (
              <ul className="space-y-2">
                {archives.map(snapshot => (
                  <li key={snapshot.date}>
                    <a
                      href={`/cjenik/arhiva/${encodeURIComponent(snapshot.filename)}`}
                      className="text-sm text-forest underline-offset-2 hover:underline break-all"
                    >
                      {snapshot.date} — {snapshot.filename}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
