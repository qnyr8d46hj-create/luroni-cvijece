import type { Metadata } from 'next'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { GallerySection } from '@/app/components/GallerySection'
import { RecentBouquetsSection } from '@/app/components/RecentBouquetsSection'
import { loadGalleryPagePhotos } from '@/lib/gbpGallery/read'

const PAGE_URL = 'https://www.luroni-cvijece.com/galerija'
const TITLE = 'Galerija buketa | Luroni Cvijeće'
const DESCRIPTION = 'Svaki buket je poseban. Pogledajte neke od naših posljednjih cvjetnih kreacija.'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
    languages: { 'hr-HR': PAGE_URL },
  },
  openGraph: {
    type: 'website',
    locale: 'hr_HR',
    url: PAGE_URL,
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default async function GalerijaPage() {
  const photos = await loadGalleryPagePhotos()

  return (
    <>
      <Header />
      <main>
        {photos ? (
          <RecentBouquetsSection photos={photos} showGalleryLink={false} />
        ) : (
          <GallerySection />
        )}
      </main>
      <Footer />
    </>
  )
}
