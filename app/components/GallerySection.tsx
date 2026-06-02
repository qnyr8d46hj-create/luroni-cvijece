import { GALLERY_IMAGES_FEATURED, GALLERY_IMAGES_ALL } from '@/lib/data'
import { GalleryGrid }    from './GalleryGrid'

// ── Trust badge icons ──────────────────────────────────────
function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-forest">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-forest">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0 text-forest">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

// ── Trust badge pill ───────────────────────────────────────
function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-[0.5625rem] rounded-full
      bg-forest-light border border-forest/[0.14]">
      {icon}
      <span className="text-[0.8125rem] font-medium text-forest whitespace-nowrap leading-none">
        {label}
      </span>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────
export function GallerySection() {
  return (
    <section
      id="gallery"
      className="py-20 md:py-28 bg-cream overflow-hidden"
      aria-labelledby="gallery-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        {/* ── Top area: title/desc left · badges right ─────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 md:mb-16">

          {/* Left: eyebrow + title + description */}
          <div className="max-w-xl">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
              Naši radovi
            </p>
            <h2
              id="gallery-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
            >
              Stvarni buketi koje smo složili
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] max-w-lg">
              Pogledajte primjere buketa koje smo složili za naše kupce. Svaki buket je
              jedinstven i slaže se prema dostupnom sezonskom cvijeću, prigodi i odabranoj
              veličini.
            </p>
          </div>

          {/* Right: trust badge pills */}
          <div className="flex flex-row flex-wrap lg:flex-col lg:items-end gap-2.5">
            <TrustBadge icon={<CameraIcon />} label="Stvarne fotografije" />
            <TrustBadge icon={<HeartIcon />}  label="Buketi složeni za kupce" />
            <TrustBadge icon={<PinIcon />}    label="Rijeka i okolica" />
          </div>

        </div>

        {/* ── Interactive gallery (client) ──────────────────────── */}
        <GalleryGrid featuredImages={GALLERY_IMAGES_FEATURED} allImages={GALLERY_IMAGES_ALL} />

      </div>
    </section>
  )
}
