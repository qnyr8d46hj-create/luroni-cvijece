'use client'

import { useState } from 'react'
import Image from 'next/image'

// ── Price range — edit these three values to change the range.
// Keep in sync with CUSTOM_BUDGET_* in app/api/create-checkout-session/route.ts
export const CUSTOM_PRICE_MIN  = 70
export const CUSTOM_PRICE_MAX  = 200
export const CUSTOM_PRICE_STEP = 10

// Image used for the card.  To replace: swap the src constant below.
// Path is relative to /public, e.g. '/images/buket-po-zelji.jpg'
const CARD_IMAGE = '/images/featured-bouquets/buket-l.jpg'

export function CustomBouquetCard() {
  const [price, setPrice] = useState(CUSTOM_PRICE_MIN)

  const canDec = price > CUSTOM_PRICE_MIN
  const canInc = price < CUSTOM_PRICE_MAX

  function decrement() { if (canDec) setPrice(p => p - CUSTOM_PRICE_STEP) }
  function increment() { if (canInc) setPrice(p => p + CUSTOM_PRICE_STEP) }

  function handleCta() {
    window.dispatchEvent(
      new CustomEvent('luroni:selectBouquet', {
        detail: { size: 'Buket po želji', customBudget: price },
      }),
    )
    document.getElementById('order')?.scrollIntoView({ behavior: 'smooth' })
  }

  const stepperBtn =
    'w-11 h-11 flex items-center justify-center border-[1.5px] border-divider bg-cream ' +
    'text-ink text-xl font-medium transition-colors ' +
    'hover:bg-forest-light hover:border-forest ' +
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-cream disabled:hover:border-divider'

  return (
    <article
      className="group relative flex flex-col md:flex-row rounded-3xl overflow-hidden bg-white border-[1.5px] border-forest shadow-[0_2px_8px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_32px_rgba(62,107,78,0.16)] transition-all duration-300"
      aria-label={`Buket po želji — personalizirani buket od ${CUSTOM_PRICE_MIN} do ${CUSTOM_PRICE_MAX} €`}
    >
      {/* Image — left on md+, top on mobile */}
      <div className="relative w-full md:w-[42%] aspect-[16/9] md:aspect-auto flex-shrink-0 overflow-hidden bg-[linear-gradient(135deg,#ede7df,#d9d1c7)]">
        <Image
          src={CARD_IMAGE}
          alt="Personalizirani buket po vašim željama — Luroni cvijeće"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 100vw, 42vw"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 p-6 sm:p-8">
        <div>
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <h3 className="font-display text-2xl sm:text-[1.75rem] font-semibold text-ink leading-tight">
              Buket po&nbsp;želji
            </h3>
            <span className="mt-0.5 px-2.5 py-0.5 rounded-full bg-forest/[0.09] text-forest text-[0.7rem] font-bold tracking-widest uppercase">
              Personalizirano
            </span>
          </div>

          <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.68] mb-3">
            Odaberite budžet, a mi ćemo složiti jedinstven buket prema prigodi, vašim željama i
            dostupnom sezonskom cvijeću.
          </p>

          <p className="text-xs text-faint leading-[1.6] mb-6 sm:mb-8">
            Odabrani budžet uključuje cvijeće i izradu buketa. Konačan izbor cvijeća ovisi o
            sezonskoj dostupnosti.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-5">

          {/* Stepper */}
          <div>
            <p className="text-[0.6875rem] font-semibold text-faint uppercase tracking-[0.1em] mb-2">
              Odabrani budžet
            </p>
            <div className="flex items-stretch" role="group" aria-label="Odabir budžeta">
              <button
                type="button"
                onClick={decrement}
                disabled={!canDec}
                aria-label={`Smanji budžet za ${CUSTOM_PRICE_STEP} €`}
                className={`${stepperBtn} rounded-l-xl border-r-0`}
              >
                −
              </button>
              <div
                className="flex items-center justify-center min-w-[6.5rem] px-4 border-y-[1.5px] border-divider bg-white"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="text-[1.3rem] font-bold text-forest tabular-nums">
                  {price}&nbsp;€
                </span>
              </div>
              <button
                type="button"
                onClick={increment}
                disabled={!canInc}
                aria-label={`Povećaj budžet za ${CUSTOM_PRICE_STEP} €`}
                className={`${stepperBtn} rounded-r-xl border-l-0`}
              >
                +
              </button>
            </div>
            <p className="text-[0.6875rem] text-faint mt-1.5">
              {CUSTOM_PRICE_MIN}–{CUSTOM_PRICE_MAX}&nbsp;€, korak {CUSTOM_PRICE_STEP}&nbsp;€
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleCta}
            className="sm:ml-auto inline-flex items-center justify-center px-7 py-3 rounded-full bg-forest text-white text-sm font-medium whitespace-nowrap transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-md"
          >
            Odaberi buket za&nbsp;{price}&nbsp;€
          </button>

        </div>
      </div>
    </article>
  )
}
