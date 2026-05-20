import { OrderForm } from '@/app/components/OrderForm'

const STEPS = [
  'Odaberite veličinu buketa',
  'Upišite adresu i željeni termin dostave',
  'Dodajte poruku za karticu, ako želite',
  'Plaćanje karticom online ili gotovinom prilikom dostave',
]

export function OrderSection() {
  return (
    <section id="order" className="py-20 md:py-28 bg-cream" aria-labelledby="order-title">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">

          {/* Left — instructions */}
          <div>
            <h2
              id="order-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-5 leading-[1.2]"
            >
              Kako naručiti buket?
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-8">
              Naručivanje je jednostavno. Odaberite veličinu buketa, upišite podatke za
              dostavu i po želji dodajte kratku poruku za osobu kojoj šaljete buket.
            </p>

            <ol className="space-y-3" aria-label="Koraci narudžbe">
              {STEPS.map((step, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 px-5 py-4 bg-white border-[1.5px] border-divider rounded-2xl"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-forest text-white text-sm font-bold flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[0.9375rem] font-medium text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Right — form card */}
          <div className="bg-white border-[1.5px] border-divider rounded-3xl p-5 sm:p-8 shadow-lg lg:sticky lg:top-24">
            <OrderForm />
          </div>

        </div>
      </div>
    </section>
  )
}
