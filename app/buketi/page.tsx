import type { Metadata } from 'next'
import { Header } from '@/app/components/Header'
import { BouquetTypesSection } from '@/app/components/BouquetTypesSection'
import { OrderSection } from '@/app/components/OrderSection'
import { GallerySection } from '@/app/components/GallerySection'
import { Footer } from '@/app/components/Footer'

const TITLE = 'Buketi S, M i L s dostavom u Rijeci | Luroni Cvijeće'
const DESCRIPTION =
  'Naručite bukete S, M i L s dostavom cvijeća u Rijeci, okolici i na otoku Krku. Ručno složeni sezonski buketi, uključujući Buket po želji.'
const CANONICAL = 'https://www.luroni-cvijece.com/buketi'
const OG_IMAGE = '/images/hero/hero-buket.jpg'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL,
    languages: { 'hr-HR': CANONICAL },
  },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         CANONICAL,
    siteName:    'Luroni Cvijeće',
    title:       TITLE,
    description: DESCRIPTION,
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    'Luroni Cvijeće — ručno složeni buketi s dostavom u Rijeci i na Krku',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESCRIPTION,
    images:      [OG_IMAGE],
  },
}

export default function BuketiPage() {
  return (
    <>
      <Header />
      <main>
        <section
          className="bg-cream pt-16 md:pt-20 pb-2"
          aria-labelledby="buketi-title"
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
            <header className="text-center max-w-2xl mx-auto">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
                Odaberite buket
              </p>
              <h1
                id="buketi-title"
                className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
              >
                Buketi S, M i L
              </h1>
              <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
                Ručno složeni buketi s dostavom cvijeća u Rijeci, okolici i na otoku Krku.
                Odaberite veličinu ili prepustite izbor floristu uz Buket po želji.
              </p>
            </header>
          </div>
        </section>

        <BouquetTypesSection preselectSizeOnCta />
        <OrderSection />
        <GallerySection />
      </main>
      <Footer />
    </>
  )
}
