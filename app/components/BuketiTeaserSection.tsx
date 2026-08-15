import Link from 'next/link'

export function BuketiTeaserSection() {
  return (
    <section
      id="bouquets"
      className="py-16 md:py-20 bg-cream scroll-mt-20"
      aria-labelledby="bouquets-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-xl">
          <h2
            id="bouquets-title"
            className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-4 leading-[1.2]"
          >
            Radije sami odaberete veličinu?
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-7">
            Klasični buketi S, M i L i dalje su dostupni.
          </p>
          <Link
            href="/buketi"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border-[1.5px] border-forest text-forest font-medium text-[0.9375rem] transition-all hover:bg-forest hover:text-white"
          >
            Pogledajte bukete
          </Link>
        </div>
      </div>
    </section>
  )
}
