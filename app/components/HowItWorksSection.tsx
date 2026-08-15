const STEPS = [
  {
    title: 'Odaberite prigodu',
    body: 'Recite nam što želite poručiti.',
  },
  {
    title: 'Dodajte detalje',
    body: 'Napišite poruku, adresu i željeni termin dostave.',
  },
  {
    title: 'Florist slaže buket',
    body: 'Buket izrađujemo od svježeg cvijeća prema prigodi i vašim željama.',
  },
  {
    title: 'Mi ga dostavljamo',
    body: 'Cvijeće stiže na željenu adresu u dogovorenom terminu.',
  },
] as const

export function HowItWorksSection() {
  return (
    <section
      className="py-16 md:py-24 bg-cream"
      aria-labelledby="how-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <h2
          id="how-title"
          className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-ink mb-12 md:mb-16 leading-[1.2] max-w-2xl [text-wrap:balance]"
        >
          Vi odaberite trenutak. Mi ćemo se pobrinuti za ostalo.
        </h2>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <p
                className="font-display text-3xl font-semibold text-forest/70 mb-3 leading-none"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-2 leading-tight">
                {step.title}
              </h3>
              <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.7]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
