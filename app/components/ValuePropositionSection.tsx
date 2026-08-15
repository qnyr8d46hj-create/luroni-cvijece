const VALUES = [
  {
    title: 'Složeno prema prigodi',
    body: 'Ne biramo cvijeće samo prema veličini. Svaki buket prilagođavamo trenutku i osobi kojoj ga šaljete.',
  },
  {
    title: 'Svježe i sezonsko',
    body: 'Naš florist bira najljepše dostupno cvijeće i svaki buket slaže pojedinačno.',
  },
  {
    title: 'Dostavljeno umjesto vas',
    body: 'Buket dostavljamo na željenu adresu u Rijeci, okolici i na otoku Krku.',
  },
] as const

export function ValuePropositionSection() {
  return (
    <section
      className="py-16 md:py-24 bg-white"
      aria-labelledby="value-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <h2 id="value-title" className="sr-only">
          Zašto odabrati Luroni
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
          {VALUES.map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ink mb-3 leading-tight">
                {item.title}
              </h3>
              <p className="text-[0.9375rem] sm:text-base text-muted leading-[1.75]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
