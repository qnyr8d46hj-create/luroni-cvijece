import { OCCASIONS } from '@/lib/occasions'
import { OccasionCard } from './OccasionCard'

function cardLayoutClass(index: number): string {
  if (index < 3) return 'lg:col-span-2'
  if (index === 3) return 'lg:col-span-3'
  return 'sm:col-span-2 sm:max-w-lg sm:justify-self-center lg:col-span-3 lg:max-w-none'
}

export function OccasionSection() {
  const occasions = [...OCCASIONS].sort((a, b) => a.order - b.order)

  return (
    <section
      id="prigode"
      className="py-20 md:py-28 bg-cream"
      aria-labelledby="prigode-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <header className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Prigode
          </p>
          <h2
            id="prigode-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Što želite reći cvijećem?
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Odaberite prigodu, a mi ćemo se pobrinuti za ostalo.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 md:gap-6">
          {occasions.map((occasion, index) => (
            <div key={occasion.id} className={cardLayoutClass(index)}>
              <OccasionCard occasion={occasion} />
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
