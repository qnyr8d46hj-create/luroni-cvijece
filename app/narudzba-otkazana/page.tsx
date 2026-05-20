import type { Metadata } from 'next'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Plaćanje otkazano | Luroni Cvijeće',
  description: 'Plaćanje je otkazano. Narudžba nije dovršena.',
  robots: { index: false, follow: false },
}

export default function NarudzbaOtkazanaPage() {
  return (
    <>
      <Header />

      <main
        className="min-h-[75vh] flex items-center justify-center bg-cream px-5 py-20"
        aria-labelledby="cancel-title"
      >
        <div className="w-full max-w-md text-center">

          {/* Neutral X icon — intentionally calm, not alarming */}
          <div
            className="w-20 h-20 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-8"
            aria-hidden="true"
          >
            <svg
              width="34" height="34" viewBox="0 0 24 24"
              fill="none" stroke="#9ca3af" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </div>

          <h1
            id="cancel-title"
            className="font-display text-4xl sm:text-5xl font-semibold text-ink mb-4 leading-[1.15]"
          >
            Plaćanje otkazano
          </h1>

          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-3">
            Plaćanje nije dovršeno i narudžba nije potvrđena.
          </p>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-10">
            Možete pokušati ponovo ili nas kontaktirati na{' '}
            <a
              href="mailto:info.luroni@gmail.com"
              className="text-forest underline underline-offset-2 hover:text-forest-dark transition-colors"
            >
              info.luroni@gmail.com
            </a>
            .
          </p>

          <a
            href="/#order"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full
              bg-forest text-white font-medium text-[1.0625rem]
              hover:bg-forest-dark transition-colors"
          >
            Pokušaj ponovo
          </a>

        </div>
      </main>

      <Footer />
    </>
  )
}
