import Link from 'next/link'
import { BouquetPhotoGrid } from './BouquetPhotoGrid'
import type { PublicGalleryPhoto } from '@/lib/gbpGallery/public'

export function RecentBouquetsSection({
  photos,
  showGalleryLink = true,
}: {
  photos: PublicGalleryPhoto[]
  showGalleryLink?: boolean
}) {
  return (
    <section
      id={showGalleryLink ? 'bouquets' : 'galerija'}
      className="py-20 md:py-28 bg-cream overflow-hidden"
      aria-labelledby="gallery-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-xl mb-12 md:mb-16">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Galerija
          </p>
          <h2
            id="gallery-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Naši nedavno izrađeni buketi
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Svaki buket je poseban. Pogledajte neke od naših posljednjih cvjetnih kreacija.
          </p>
        </div>

        <BouquetPhotoGrid photos={photos} />

        {showGalleryLink && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/galerija"
              className="group inline-flex items-center gap-2.5 px-7 py-3 rounded-full
                border-[1.5px] border-forest text-forest text-sm font-medium tracking-[0.03em]
                hover:bg-forest hover:text-white transition-all duration-200"
            >
              Pogledaj cijelu galeriju
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
