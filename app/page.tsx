import { Header }             from '@/app/components/Header'
import { HeroSection }        from '@/app/components/HeroSection'
import { GallerySection }     from '@/app/components/GallerySection'
import { BouquetTypesSection } from '@/app/components/BouquetTypesSection'
import { OrderSection }       from '@/app/components/OrderSection'
import { LocalSeoSection }    from '@/app/components/LocalSeoSection'
import { FaqSection }         from '@/app/components/FaqSection'
import { ArtificialCatalogTeaser } from '@/app/components/ArtificialCatalogTeaser'
import { ContactSection }     from '@/app/components/ContactSection'
import { Footer }             from '@/app/components/Footer'
import { JsonLd }             from '@/app/components/JsonLd'
import { floristJsonLd, homepageFaqJsonLd } from '@/lib/seo'
import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'
import { loadHomepagePhotos } from '@/lib/gbpGallery/read'
import { RecentBouquetsSection } from '@/app/components/RecentBouquetsSection'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const recentBouquets = await loadHomepagePhotos()

  return (
    <>
      <JsonLd data={floristJsonLd} />
      <JsonLd data={homepageFaqJsonLd} />
      <Header />
      <main>
        <HeroSection />
        {recentBouquets ? <RecentBouquetsSection photos={recentBouquets} /> : <GallerySection />}
        <BouquetTypesSection />
        <OrderSection />
        <LocalSeoSection />
        <FaqSection />
        {ARTIFICIAL_ARRANGEMENTS_PUBLIC && <ArtificialCatalogTeaser />}
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
