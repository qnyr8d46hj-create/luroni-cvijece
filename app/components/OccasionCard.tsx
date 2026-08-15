import Image from 'next/image'
import type { Occasion } from '@/lib/occasions'

export function OccasionCard({ occasion }: { occasion: Occasion }) {
  return (
    <a
      href="#order"
      className="group flex flex-col h-full rounded-3xl overflow-hidden bg-white border border-divider
        shadow-[0_1px_4px_rgba(0,0,0,0.07)]
        transition-all duration-300
        hover:-translate-y-1.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-2"
      aria-label={`${occasion.title} — nastavite na narudžbu`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(135deg,#ede7df,#d9d1c7)]">
        <Image
          src={occasion.image}
          alt={occasion.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </div>

      <div className="flex flex-col flex-1 p-5 sm:p-6">
        <h3 className="font-display text-2xl font-semibold text-ink leading-tight mb-2">
          {occasion.title}
        </h3>
        <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.68] flex-1">
          {occasion.description}
        </p>
        <span className="mt-4 text-sm font-medium text-forest">
          Odaberite
        </span>
      </div>
    </a>
  )
}
