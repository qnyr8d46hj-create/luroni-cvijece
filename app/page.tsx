import { Header }             from '@/app/components/Header'
import { HeroSection }        from '@/app/components/HeroSection'
import { GallerySection }     from '@/app/components/GallerySection'
import { BouquetTypesSection } from '@/app/components/BouquetTypesSection'
import { OrderSection }       from '@/app/components/OrderSection'
import { LocalSeoSection }    from '@/app/components/LocalSeoSection'
import { FaqSection }         from '@/app/components/FaqSection'
import { ContactSection }     from '@/app/components/ContactSection'
import { Footer }             from '@/app/components/Footer'
import { JsonLd }             from '@/app/components/JsonLd'
import { floristJsonLd, homepageFaqJsonLd } from '@/lib/seo'

export default function Home() {
  return (
    <>
      <JsonLd data={floristJsonLd} />
      <JsonLd data={homepageFaqJsonLd} />
      <Header />
      <main>
        <HeroSection />
        <GallerySection />
        <BouquetTypesSection />
        <OrderSection />
        <LocalSeoSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
