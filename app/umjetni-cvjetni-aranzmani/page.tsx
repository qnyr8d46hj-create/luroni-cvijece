import type { Metadata } from 'next'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { ArtificialProductCard } from '@/app/components/ArtificialProductCard'
import {
  ARTIFICIAL_BOUQUET_PAGE_PATH,
  getPublicArtificialBouquets,
  type ArtificialBouquet,
} from '@/lib/artificialBouquets'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/seo'
import { isArtificialCheckoutEnabled } from '@/lib/artificialCheckoutEnabled'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAGE_URL = `${SITE_URL}${ARTIFICIAL_BOUQUET_PAGE_PATH}`
const TITLE = 'Umjetni cvjetni aranžmani za Svi svete | Luroni Cvijeće'
const DESCRIPTION =
  'Gotovi umjetni cvjetni aranžmani za grobna mjesta. Odaberite model s fotografije i naručite dostavu putem Luroni cvijeća.'

export const metadata: Metadata = {
  title:       TITLE,
  description: DESCRIPTION,
  keywords: [
    'umjetni cvjetni aranžmani',
    'aranžmani za Svi svete',
    'grobni aranžmani',
    'umjetno cvijeće Rijeka',
  ],
  alternates: {
    canonical: PAGE_URL,
    languages: { 'hr-HR': PAGE_URL },
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-image-preview': 'large',
      'max-snippet':       -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         PAGE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESCRIPTION,
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    'Luroni Cvijeće — umjetni cvjetni aranžmani',
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

export default async function ArtificialArrangementsPage() {
  let products: ArtificialBouquet[] = []
  let loadError = false

  try {
    const catalog = await getPublicArtificialBouquets()
    products = catalog.products
    if (catalog.skipped.length > 0) {
      console.warn(
        '[artificial-bouquets] skipped incomplete documents:',
        catalog.skipped.map(item => `${item.sku}: ${item.reason}`).join('; '),
      )
    }
  } catch (err) {
    console.error('[artificial-bouquets] catalog read failed:', err)
    loadError = true
  }

  return (
    <>
      <Header />
      <main className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
          <header className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
            <h1 className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]">
              Umjetni cvjetni aranžmani za Svi svete
            </h1>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
              Odaberite gotovi aranžman s fotografije. Pažljivo izrađeni umjetni buketi za
              grobna mjesta.
              {isArtificialCheckoutEnabled()
                ? ' Naručite dostavu putem Luroni cvijeća.'
                : ' Naručivanje putem stranice bit će uskoro dostupno. Svježi buketi se i dalje naručuju na početnoj stranici.'}
            </p>
          </header>

          {loadError ? (
            <p className="text-center text-muted leading-[1.7] max-w-xl mx-auto" role="alert">
              Katalog trenutačno nije dostupan. Pokušajte ponovno malo kasnije ili naručite
              svježi buket na početnoj stranici.
            </p>
          ) : products.length === 0 ? (
            <p className="text-center text-muted leading-[1.7] max-w-xl mx-auto">
              Katalog umjetnih aranžmana se priprema. Svježi buketi i dalje su dostupni za
              narudžbu.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 items-stretch">
              {products.map(product => (
                <ArtificialProductCard
                  key={product.sku}
                  product={product}
                  checkoutEnabled={isArtificialCheckoutEnabled()}
                />
              ))}
            </div>
          )}

          <p className="text-center text-sm text-muted leading-[1.7] max-w-3xl mx-auto mt-10">
            Fotografije prikazuju konkretne modele aranžmana. Kod ručno izrađenih primjeraka
            moguća su manja odstupanja u rasporedu cvijeća.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
