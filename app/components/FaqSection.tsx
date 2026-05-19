'use client'

import { useState } from 'react'
import { FAQS } from '@/lib/data'

// ── Single accordion item ──────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-divider last:border-0">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
      >
        <span className="text-[0.9375rem] font-semibold text-ink leading-snug">
          {question}
        </span>
        <span
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center
            border border-divider bg-white
            transition-all duration-200
            group-hover:border-forest group-hover:bg-forest-light
            ${open ? 'bg-forest-light border-forest' : ''}`}
          aria-hidden="true"
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            className={`text-forest transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Smooth expand — max-height transition */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-[320px]' : 'max-h-0'
        }`}
      >
        <p className="pb-5 text-[0.9rem] text-muted leading-[1.75]">
          {answer}
        </p>
      </div>
    </div>
  )
}

// ── Section ────────────────────────────────────────────────
export function FaqSection() {
  return (
    <section id="faq" className="py-20 md:py-24 bg-cream" aria-labelledby="faq-title">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">

        <div className="max-w-2xl mx-auto lg:mx-0 mb-12">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Česta pitanja
          </p>
          <h2
            id="faq-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink leading-[1.2]"
          >
            Sve što trebate znati
          </h2>
        </div>

        {/* Two-column layout on large screens, single column below */}
        <div className="max-w-2xl lg:max-w-none mx-auto grid grid-cols-1 lg:grid-cols-2 lg:gap-x-20">

          {/* Left column */}
          <div>
            {FAQS.slice(0, Math.ceil(FAQS.length / 2)).map(({ question, answer }) => (
              <FaqItem key={question} question={question} answer={answer} />
            ))}
          </div>

          {/* Right column */}
          <div className="lg:border-t-0">
            {FAQS.slice(Math.ceil(FAQS.length / 2)).map(({ question, answer }) => (
              <FaqItem key={question} question={question} answer={answer} />
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
