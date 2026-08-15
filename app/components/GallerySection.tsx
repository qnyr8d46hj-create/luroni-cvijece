import { GALLERY_IMAGES_FEATURED, GALLERY_IMAGES_ALL } from '@/lib/data'
import { GalleryGrid } from './GalleryGrid'

export function GallerySection() {
  return (
    <section
      id="gallery"
      className="py-16 md:py-24 bg-white overflow-hidden"
      aria-labelledby="gallery-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <header className="max-w-xl mb-10 md:mb-14">
          <h2
            id="gallery-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Buketi koje smo složili
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Svaki buket izrađujemo pojedinačno, zato nijedan nije potpuno isti.
          </p>
        </header>

        <GalleryGrid featuredImages={GALLERY_IMAGES_FEATURED} allImages={GALLERY_IMAGES_ALL} />

      </div>
    </section>
  )
}
