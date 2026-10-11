import Link from 'next/link'

export function ArtificialCatalogTeaser() {
  return (
    <section
      className="py-12 md:py-16 bg-cream border-t border-divider"
      aria-labelledby="artificial-catalog-teaser-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            id="artificial-catalog-teaser-title"
            className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-3 leading-[1.25]"
          >
            Umjetni cvjetni aranžmani za Svi svete
          </h2>
          <p className="text-sm sm:text-base text-muted leading-[1.7] mb-6">
            Pregledajte gotove modele s fotografije. Svježi buketi se i dalje naručuju na
            početnoj stranici.
          </p>
          <Link
            href="/umjetni-cvjetni-aranzmani"
            className="inline-flex items-center justify-center px-7 py-3 rounded-full border-[1.5px] border-forest text-forest text-sm font-medium transition-all hover:bg-forest-light"
          >
            Pogledaj aranžmane
          </Link>
        </div>
      </div>
    </section>
  )
}
