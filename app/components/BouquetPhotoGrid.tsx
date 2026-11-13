'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { PublicGalleryPhoto } from '@/lib/gbpGallery/public'

export function BouquetPhotoGrid({
  photos,
  initialCount,
  pageSize,
  showCaptions = false,
  gridClassName = 'grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5',
  sizes = '(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 22rem',
}: {
  photos: PublicGalleryPhoto[]
  initialCount?: number
  pageSize?: number
  showCaptions?: boolean
  gridClassName?: string
  sizes?: string
}) {
  const [active, setActive] = useState<PublicGalleryPhoto | null>(null)
  const [visibleCount, setVisibleCount] = useState(initialCount ?? photos.length)
  const opener = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const visiblePhotos = photos.slice(0, visibleCount)
  const canLoadMore = initialCount !== undefined && visibleCount < photos.length

  function loadMore() {
    const step = pageSize ?? initialCount ?? photos.length
    setVisibleCount((count) => Math.min(photos.length, count + step))
  }

  useEffect(() => {
    if (!active) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      opener.current?.focus()
    }
  }, [active])

  return (
    <>
      <ul className={gridClassName}>
        {visiblePhotos.map((photo, index) => {
          const imageButton = (
            <button
              type="button"
              onClick={(event) => {
                opener.current = event.currentTarget
                setActive(photo)
              }}
              className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl
                bg-[linear-gradient(135deg,#ede7df,#d4cdc3)] text-left
                shadow-[0_2px_14px_rgba(0,0,0,0.09)]
                hover:shadow-[0_10px_36px_rgba(0,0,0,0.15)]
                transition-shadow duration-300
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                sizes={sizes}
                loading={showCaptions && index < (initialCount ?? 0) ? 'eager' : 'lazy'}
              />
            </button>
          )
          return (
            <li key={photo.id} className="h-full">
              {showCaptions ? (
                <figure className="flex h-full flex-col">
                  {imageButton}
                  <figcaption className="flex min-h-24 flex-col px-0.5 pt-3">
                    <h3 className="line-clamp-2 font-display text-[1.02rem] font-semibold leading-snug text-ink sm:text-[1.08rem]">
                      {photo.title}
                    </h3>
                    {photo.description ? (
                      <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-muted">
                        {photo.description}
                      </p>
                    ) : null}
                  </figcaption>
                </figure>
              ) : (
                imageButton
              )}
            </li>
          )
        })}
      </ul>

      {canLoadMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full
              border-[1.5px] border-forest text-forest text-sm font-medium tracking-[0.03em]
              hover:bg-forest hover:text-white transition-all duration-200"
          >
            Učitaj još
          </button>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center sm:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-ink/75"
            aria-label="Zatvori fotografiju"
            onClick={() => setActive(null)}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bouquet-lightbox-title"
            tabIndex={-1}
            className="relative z-10 w-full max-w-md outline-none"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-cream shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <Image
                src={active.src}
                alt={active.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 28rem"
                loading="eager"
              />
            </div>
            {showCaptions ? (
              <>
                <p id="bouquet-lightbox-title" className="mt-4 text-center text-base font-medium text-white break-words">
                  {active.title}
                </p>
                {active.description ? (
                  <p className="mt-2 text-center text-sm leading-relaxed text-white/80 break-words">
                    {active.description}
                  </p>
                ) : null}
              </>
            ) : (
              <p id="bouquet-lightbox-title" className="mt-4 text-center text-sm text-white/90">
                {active.alt}
              </p>
            )}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setActive(null)}
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
