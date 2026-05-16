'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/data'

// ── Constants ──────────────────────────────────────────────
const INITIAL_DESKTOP = 6
const INITIAL_MOBILE  = 4

// ── Card ───────────────────────────────────────────────────
interface CardProps {
  image:      GalleryImage
  index:      number
  /** New card that should animate in after expansion */
  animateIn?: boolean
  /** Stagger delay index (0-based among new cards) */
  stagger?:   number
  sizes:      string
}

function BouquetCard({ image, index, animateIn, stagger = 0, sizes }: CardProps) {
  return (
    <div
      className="relative aspect-[3/4] rounded-2xl overflow-hidden group
        bg-[linear-gradient(135deg,#ede7df,#d4cdc3)]
        shadow-[0_2px_14px_rgba(0,0,0,0.09)]
        hover:shadow-[0_10px_36px_rgba(0,0,0,0.15)]
        transition-shadow duration-300"
      style={
        animateIn
          ? {
              // fill-mode "both" applies the `from` keyframe (opacity:0) during
              // the delay so we never need an explicit opacity:0 here.
              // If the keyframe fails to load, the element stays visible rather
              // than stuck invisible.
              animation: 'fadeSlideIn 0.5s ease both',
              animationDelay: `${stagger * 65}ms`,
            }
          : undefined
      }
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        sizes={sizes}
        loading={index < 4 ? 'eager' : 'lazy'}
      />

    </div>
  )
}

// ── Expand button ──────────────────────────────────────────
function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-10 flex justify-center">
      <button
        onClick={onClick}
        className="group inline-flex items-center gap-2.5 px-7 py-3 rounded-full
          border-[1.5px] border-forest text-forest text-sm font-medium tracking-[0.03em]
          hover:bg-forest hover:text-white
          transition-all duration-200"
      >
        Pogledaj više buketa
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-y-0.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────
export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [expanded, setExpanded] = useState(false)

  const desktopImages = expanded ? images : images.slice(0, INITIAL_DESKTOP)
  const mobileImages  = expanded ? images : images.slice(0, INITIAL_MOBILE)

  const showDesktopBtn = !expanded && images.length > INITIAL_DESKTOP
  const showMobileBtn  = !expanded && images.length > INITIAL_MOBILE

  return (
    <>
      {/* ── Desktop / tablet grid — hidden on mobile ─────────── */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {desktopImages.map((img, i) => (
            <BouquetCard
              key={img.src}
              image={img}
              index={i}
              animateIn={expanded && i >= INITIAL_DESKTOP}
              stagger={i - INITIAL_DESKTOP}
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          ))}
        </div>

        {showDesktopBtn && <ExpandButton onClick={() => setExpanded(true)} />}
      </div>

      {/* ── Mobile carousel — hidden on sm+ ──────────────────── */}
      <div className="sm:hidden">
        {/*
          Negative horizontal margin breaks out of the section padding so
          cards bleed to the screen edge and the right-side peek is visible.
          scroll-padding-left aligns snap points with the visible left edge.
        */}
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 -mx-5 px-5 pb-2 carousel-scroll"
          style={{ scrollPaddingLeft: '1.25rem' }}
        >
          {mobileImages.map((img, i) => (
            <div
              key={img.src}
              className="shrink-0 snap-start"
              style={{ width: 'calc(82vw)' }}
            >
              <BouquetCard
                image={img}
                index={i}
                animateIn={expanded && i >= INITIAL_MOBILE}
                stagger={i - INITIAL_MOBILE}
                sizes="82vw"
              />
            </div>
          ))}
          {/* Right-edge breathing room so the last card never clips */}
          <div className="shrink-0 w-5" aria-hidden="true" />
        </div>

        {showMobileBtn && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setExpanded(true)}
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full
                border-[1.5px] border-forest text-forest text-sm font-medium tracking-[0.03em]
                hover:bg-forest hover:text-white
                transition-all duration-200"
            >
              Pogledaj više buketa
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-y-0.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  )
}
