import Image from 'next/image'
import { GALLERY_IMAGES } from '@/lib/data'

export function GallerySection() {
  return (
    <section id="gallery" className="py-20 md:py-28 bg-cream" aria-labelledby="gallery-title">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <header className="text-center max-w-2xl mx-auto mb-14">
          <h2
            id="gallery-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Stvarni buketi koje smo složili
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Pogledajte primjere buketa koje smo već složili za naše kupce. Svaki buket je
            jedinstven i slaže se prema dostupnom sezonskom cvijeću, prigodi i odabranoj veličini.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {GALLERY_IMAGES.map((image, index) => (
            <div
              key={image.src}
              className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[linear-gradient(135deg,#ede7df,#d9d1c7)] group shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] transition-shadow duration-300"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                loading={index < 3 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
