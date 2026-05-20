import type { Metadata } from 'next'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Hvala na narudžbi! | Luroni Cvijeće',
  description: 'Vaša narudžba buketa je zaprimljena. Javit ćemo vam se uskoro.',
  robots: { index: false, follow: false },
}

export default function NarudzbaUspjesnaPage() {
  return (
    <>
      <Header />

      <main
        className="min-h-[75vh] flex items-center justify-center bg-cream px-5 py-20"
        aria-labelledby="success-title"
      >
        <div className="w-full max-w-md text-center">

          {/* Animated checkmark */}
          <div
            className="w-20 h-20 rounded-full bg-forest flex items-center justify-center mx-auto mb-8 animate-pop"
            aria-hidden="true"
          >
            <svg
              width="36" height="36" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1
            id="success-title"
            className="font-display text-4xl sm:text-5xl font-semibold text-ink mb-4 leading-[1.15]"
          >
            Hvala na narudžbi!
          </h1>

          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-3">
            Uplata je uspješno zaprimljena.
          </p>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-10">
            Javit ćemo vam se uskoro radi potvrde dostupnosti i termina dostave.
          </p>

          <a
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full
              bg-forest text-white font-medium text-[1.0625rem]
              hover:bg-forest-dark transition-colors"
          >
            Natrag na početnu
          </a>

        </div>
      </main>

      <Footer />
    </>
  )
}
