import { DELIVERY_AREAS } from '@/lib/data'

export function LocalSeoSection() {
  return (
    <section id="contact" className="py-20 md:py-28 bg-forest" aria-labelledby="seo-title">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Text */}
          <div>
            <h2
              id="seo-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-white mb-5 leading-[1.2]"
            >
              Dostava cvijeća Rijeka, okolica i otok Krk
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-white/80 leading-[1.75] mb-8">
              Luroni cvijeće omogućuje jednostavnu online narudžbu buketa s dostavom na
              području Rijeke, okolice i otoka Krka. Bukete dostavljamo u roku 24h, ovisno
              o dostupnosti cvijeća i dogovorenom terminu. U ponudi su buketi različitih
              veličina, od manjih pažnji do raskošnijih buketa za posebne prigode.
            </p>
            <a
              href="#order"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border-2 border-white/55 text-white font-medium transition-all hover:bg-white/[0.14] hover:border-white"
            >
              Naruči s dostavom
            </a>
          </div>

          {/* Delivery areas */}
          <div className="bg-white/[0.1] border border-white/20 rounded-3xl p-8">
            <h3 className="font-display text-2xl font-semibold text-white mb-2">
              Područja dostave
            </h3>
            <p className="text-sm text-white/65 mb-5">Dostavljamo na području:</p>
            <ul className="flex flex-wrap gap-2" aria-label="Mjesta dostave">
              {DELIVERY_AREAS.map((area) => (
                <li
                  key={area}
                  className="px-4 py-1.5 rounded-full bg-white/[0.14] border border-white/25 text-sm font-medium text-white"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}
