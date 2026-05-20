import Image from 'next/image'

const TRUST_BADGES = [
  { icon: <TruckIcon />,   text: 'Besplatna dostava' },
  { icon: <ClockIcon />,   text: 'Dostava u roku 24h' },
  { icon: <MapPinIcon />,  text: 'Rijeka, okolica i otok Krk' },
  { icon: <CardIcon />,    text: 'Plaćanje karticom ili gotovinom' },
]

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#1d3326]"
      aria-label="Naslovna"
    >
      {/* Background image — decorative, hence alt="" */}
      <Image
        src="/images/hero/hero-buket.jpg"
        alt=""
        fill
        preload
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(10,22,14,0.72)_0%,rgba(10,22,14,0.52)_55%,rgba(10,22,14,0.18)_100%)] md:bg-[linear-gradient(105deg,rgba(10,22,14,0.68)_0%,rgba(10,22,14,0.46)_55%,rgba(10,22,14,0.14)_100%)]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <div className="max-w-[620px]">

          <h1 className="font-display text-[2.1rem] sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.14] text-white mb-5 [text-wrap:balance]">
            Dostava svježih buketa u Rijeci, okolici i na otoku Krku
          </h1>

          <p className="text-base sm:text-[1.125rem] text-white/85 leading-[1.7] mb-9 max-w-[540px]">
            Naručite pažljivo složen buket za poklon, iznenađenje ili posebnu prigodu.
            Dostavljamo u roku 24h, uz besplatnu dostavu.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-11">
            <a
              href="#order"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-forest text-white font-medium text-[1.0625rem] transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-lg"
            >
              Naruči buket
            </a>
            <a
              href="#bouquets"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full border-2 border-white/65 text-white font-medium text-[1.0625rem] transition-all hover:bg-white/[0.14] hover:border-white"
            >
              Pogledaj bukete
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2.5">
            {TRUST_BADGES.map((badge) => (
              <div
                key={badge.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.11] border border-white/[0.22] backdrop-blur-sm text-white text-sm font-medium"
              >
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}

function TruckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
