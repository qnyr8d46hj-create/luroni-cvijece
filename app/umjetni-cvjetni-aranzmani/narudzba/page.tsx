import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { ArtificialOrderForm } from '@/app/components/ArtificialOrderForm'
import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'
import {
  ARTIFICIAL_BOUQUET_ORDER_PATH,
  ARTIFICIAL_BOUQUET_PAGE_PATH,
} from '@/lib/artificialBouquetPaths'
import { getPurchasableArtificialBouquet } from '@/lib/artificialBouquets'
import { pageSeo } from '@/lib/seo'
import {
  ARTIFICIAL_CHECKOUT_DISABLED_NOTICE,
  isArtificialCheckoutEnabled,
} from '@/lib/artificialCheckoutEnabled'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateMetadata(): Metadata {
  if (!ARTIFICIAL_ARRANGEMENTS_PUBLIC) notFound()
  return pageSeo({
    title: 'Naruči umjetni aranžman | Luroni Cvijeće',
    description: 'Naručite odabrani umjetni cvjetni aranžman s dostavom u Rijeci, okolici i na otoku Krku.',
    path: ARTIFICIAL_BOUQUET_ORDER_PATH,
    index: false,
  })
}

function OrderMessage({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-10">
      <h1 className="font-display text-3xl font-semibold text-ink mb-4">{title}</h1>
      <p className="text-muted leading-[1.7] mb-8">{children}</p>
      <Link
        href={ARTIFICIAL_BOUQUET_PAGE_PATH}
        className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-forest text-white font-medium hover:bg-forest-dark transition-colors"
      >
        Natrag na katalog
      </Link>
    </div>
  )
}

export default async function ArtificialOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string }>
}) {
  if (!ARTIFICIAL_ARRANGEMENTS_PUBLIC) notFound()

  const { sku } = await searchParams
  const requestedSku = typeof sku === 'string' ? sku.trim() : ''

  let product = null
  let loadError = false

  if (requestedSku) {
    try {
      product = await getPurchasableArtificialBouquet(requestedSku)
    } catch (err) {
      console.error('[artificial-order] product lookup failed:', err)
      loadError = true
    }
  }

  return (
    <>
      <Header />
      <main className="bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
          <div className="max-w-xl mx-auto">
            {!isArtificialCheckoutEnabled() ? (
              <OrderMessage title="Naručivanje uskoro">
                {ARTIFICIAL_CHECKOUT_DISABLED_NOTICE}
              </OrderMessage>
            ) : loadError ? (
              <OrderMessage title="Narudžba trenutačno nije dostupna">
                Pokušajte ponovno malo kasnije ili naručite svježi buket na početnoj stranici.
              </OrderMessage>
            ) : !requestedSku ? (
              <OrderMessage title="Odaberite aranžman">
                Narudžba umjetnog aranžmana počinje odabirom modela u katalogu.
              </OrderMessage>
            ) : !product ? (
              <OrderMessage title="Aranžman nije dostupan">
                Odabrani model ne postoji ili trenutačno nije dostupan za naručivanje.
              </OrderMessage>
            ) : (
              <>
                <header className="mb-8">
                  <p className="text-xs font-semibold tracking-[0.08em] uppercase text-faint mb-2">
                    Umjetni cvjetni aranžman
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-3 leading-[1.2]">
                    Naruči {product.name}
                  </h1>
                  <p className="text-sm text-muted leading-[1.7]">
                    Jedan aranžman po narudžbi. Cijena i model su fiksirani prema katalogu
                    i ne mogu se mijenjati u obrascu.
                  </p>
                </header>
                <div className="bg-white rounded-3xl border border-divider p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.07)]">
                  <ArtificialOrderForm
                    product={{
                      sku: product.sku,
                      name: product.name,
                      priceEur: product.priceEur,
                      image: product.image,
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
