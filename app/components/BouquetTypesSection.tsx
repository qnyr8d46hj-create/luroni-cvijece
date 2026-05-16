import Image from 'next/image'
import { BOUQUET_TYPES } from '@/lib/data'

export function BouquetTypesSection() {
  return (
    <section id="bouquets" className="py-20 md:py-28 bg-white" aria-labelledby="bouquets-title">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <header className="text-center max-w-2xl mx-auto mb-14">
          <h2
            id="bouquets-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Odaberite veličinu buketa
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Odaberite veličinu buketa prema prigodi i dojmu koji želite ostaviti. Svaki buket
            slažemo od pažljivo odabranog sezonskog cvijeća.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-7">
          {BOUQUET_TYPES.map((bouquet) => (
            <article
              key={bouquet.id}
              className={`group relative flex flex-col rounded-3xl overflow-hidden bg-white border transition-all duration-300 hover:-translate-y-1.5 ${
                bouquet.popular
                  ? 'border-forest shadow-[0_0_0_2px_#3e6b4e,0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_0_0_2px_#3e6b4e,0_12px_32px_rgba(0,0,0,0.12)]'
                  : 'border-divider shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]'
              }`}
              aria-label={`${bouquet.name}, ${bouquet.price}`}
            >
              {bouquet.popular && (
                <span className="absolute top-3.5 right-3.5 z-10 px-3 py-1 rounded-full bg-forest text-white text-[0.7rem] font-bold tracking-wider uppercase">
                  Najpopularniji
                </span>
              )}

              {/* Image */}
              <div className="relative aspect-[3/2] overflow-hidden bg-[linear-gradient(135deg,#ede7df,#d9d1c7)]">
                <Image
                  src={bouquet.image}
                  alt={bouquet.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h3 className="font-display text-2xl font-semibold text-ink">{bouquet.name}</h3>
                  <span className="text-[1.4rem] font-bold text-forest whitespace-nowrap">{bouquet.price}</span>
                </div>
                <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.68] flex-1 mb-5">
                  {bouquet.description}
                </p>
                <a
                  href="#order"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-forest text-white text-sm font-medium transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-md"
                >
                  {bouquet.cta}
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-sm text-faint italic">
          Fotografije su ilustrativnog karaktera. Svaki buket slažemo ručno od svježeg sezonskog cvijeća, pa konačan izgled može blago odstupati.
        </p>

      </div>
    </section>
  )
}
