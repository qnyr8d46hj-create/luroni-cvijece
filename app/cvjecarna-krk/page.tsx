import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { GALLERY_IMAGES_FEATURED } from '@/lib/data'

const SITE_URL  = 'https://www.luroni-cvijece.com'
const PAGE_PATH = '/cvjecarna-krk'
const PAGE_URL  = `${SITE_URL}${PAGE_PATH}`
const SITE_NAME = 'Luroni Cvijeće'
const OG_IMAGE  = '/images/hero/hero-buket.jpg'

const TITLE =
  'Cvjećarna Krk – buketi i dostava cvijeća | Luroni Cvijeće'
const DESCRIPTION =
  'Tražite cvjećarnu na Krku? Luroni izrađuje svježe bukete za rođendane, godišnjice i posebne prigode uz dostavu na otoku Krku.'

export const metadata: Metadata = {
  title:       TITLE,
  description: DESCRIPTION,
  keywords: [
    'cvjećarna Krk',
    'buketi Krk',
    'dostava cvijeća Krk',
  ],
  alternates: {
    canonical: PAGE_URL,
    languages: { 'hr-HR': PAGE_URL },
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-image-preview': 'large',
      'max-snippet':       -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         PAGE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESCRIPTION,
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    'Luroni Cvijeće — svježi buketi s dostavom na otoku Krku',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESCRIPTION,
    images:      [OG_IMAGE],
  },
  other: {
    'geo.region':       'HR-08',
    'geo.placename':    'Krk, Hrvatska',
    'geo.position':     '45.0281;14.5753',
    ICBM:               '45.0281, 14.5753',
    language:           'Croatian',
    'content-language': 'hr',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type':      'WebPage',
      '@id':        PAGE_URL,
      url:          PAGE_URL,
      name:         TITLE,
      description:  DESCRIPTION,
      inLanguage:   'hr-HR',
      isPartOf:     { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
      about:        'Cvjećarna i dostava cvijeća na otoku Krku',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type':   'ListItem',
          position:  1,
          name:      'Početna',
          item:      SITE_URL,
        },
        {
          '@type':   'ListItem',
          position:  2,
          name:      'Cvjećarna Krk',
          item:      PAGE_URL,
        },
      ],
    },
  ],
}

const HERO_BADGES = [
  { icon: <TruckIcon />,  text: 'Besplatna dostava' },
  { icon: <ClockIcon />,  text: 'Dostava u roku 24h' },
  { icon: <MapPinIcon />, text: 'Otok Krk' },
  { icon: <CardIcon />,   text: 'Plaćanje karticom ili gotovinom' },
]

const OCCASIONS = [
  {
    title: 'Rođendani',
    text:  'Razveselite slavljenika svježim buketom. Možete odabrati manji buket ili raskošniji aranžman, ovisno o prigodi i veličini koju želite.',
    icon:  <GiftIcon />,
  },
  {
    title: 'Godišnjice',
    text:  'Buket za godišnjicu ili poseban datum. Uz narudžbu možete dodati kratku poruku za karticu.',
    icon:  <HeartIcon />,
  },
  {
    title: 'Pokloni',
    text:  'Cvijeće je lijep izbor za zahvalu, čestitku ili znak pažnje — od jednostavnijeg buketa do raskošnijeg aranžmana.',
    icon:  <SparkleIcon />,
  },
  {
    title: 'Iznenađenja',
    text:  'Naručite buket online i dogovorite termin dostave na adresu na Krku. Mi ćemo ga pripremiti i dostaviti osobi koju želite iznenaditi.',
    icon:  <SurpriseIcon />,
  },
  {
    title: 'Posebne prigode',
    text:  'Za posjete, proslave i trenutke koje želite naglasiti. U ponudi su buketi različitih veličina.',
    icon:  <StarIcon />,
  },
  {
    title: 'Sezonsko cvijeće',
    text:  'Svaki buket slažemo ručno od svježeg sezonskog cvijeća, pa je svaki aranžman malo drugačiji i prilagođen sezoni.',
    icon:  <FlowerIcon />,
  },
]

const KRK_AREAS = ['Grad Krk', 'Malinska', 'Punat', 'Baška', 'Omišalj', 'Okolna naselja na otoku'] as const

const TRUST_ITEMS = [
  {
    title: 'Svježe sezonsko cvijeće',
    text:  'Svaki buket slažemo ručno od pažljivo odabranog sezonskog cvijeća. Konačan izgled može blago odstupati ovisno o dostupnosti.',
    icon:  <FlowerIcon />,
  },
  {
    title: 'Jednostavna online narudžba',
    text:  'Odaberite veličinu buketa, upišite adresu i željeni termin dostave te po želji dodajte kratku poruku za karticu.',
    icon:  <OrderIcon />,
  },
  {
    title: 'Dostava po dogovoru',
    text:  'Bukete dostavljamo u roku 24h, ovisno o dostupnosti svježeg cvijeća i dogovorenom terminu dostave.',
    icon:  <DeliveryClockIcon />,
  },
]

const GALLERY_PREVIEW = GALLERY_IMAGES_FEATURED.slice(0, 4)

export default function CvjecarnaKrkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="top">
        <Hero />
        <OccasionsSection />
        <DeliverySection />
        <TrustSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}

function Hero() {
  return (
    <section
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#1d3326]"
      aria-labelledby="krk-hero-title"
    >
      <Image
        src="/images/hero/hero-buket.jpg"
        alt=""
        fill
        preload
        className="object-cover object-center"
        sizes="100vw"
      />

      <div
        className="absolute inset-0 bg-[linear-gradient(105deg,rgba(10,22,14,0.72)_0%,rgba(10,22,14,0.52)_55%,rgba(10,22,14,0.18)_100%)] md:bg-[linear-gradient(105deg,rgba(10,22,14,0.68)_0%,rgba(10,22,14,0.46)_55%,rgba(10,22,14,0.14)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <div className="max-w-[620px]">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-white/70 mb-4">
            Luroni Cvijeće · Otok Krk
          </p>

          <h1
            id="krk-hero-title"
            className="font-display text-[2.1rem] sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.14] text-white mb-5 [text-wrap:balance]"
          >
            Cvjećarna Krk – svježi buketi s dostavom
          </h1>

          <p className="text-base sm:text-[1.125rem] text-white/85 leading-[1.7] mb-9 max-w-[540px]">
            Luroni izrađuje svježe, ručno složene bukete za rođendane, godišnjice,
            poklone i druge posebne prigode, uz dostavu na otoku Krku.
          </p>

          <div className="flex flex-wrap gap-3 mb-11">
            <Link
              href="/#order"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-forest text-white font-medium text-[1.0625rem] transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-lg"
            >
              Naruči buket
            </Link>
            <Link
              href="/#bouquets"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full border-2 border-white/65 text-white font-medium text-[1.0625rem] transition-all hover:bg-white/[0.14] hover:border-white"
            >
              Pogledaj bukete
            </Link>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {HERO_BADGES.map((badge) => (
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

function OccasionsSection() {
  return (
    <section
      className="py-20 md:py-28 bg-cream"
      aria-labelledby="occasions-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Buketi s dostavom na Krku
          </p>
          <h2
            id="occasions-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Buketi za svaku prigodu
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Na Krku dostavljamo ručno složene bukete za rođendane, godišnjice, poklone,
            iznenađenja i druge posebne trenutke. Odaberite veličinu, a mi ćemo buket
            složiti od svježeg sezonskog cvijeća.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {OCCASIONS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col p-6 bg-white border-[1.5px] border-divider rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
            >
              <span
                className="flex items-center justify-center w-11 h-11 rounded-full bg-forest-light text-forest mb-4"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <h3 className="font-display text-2xl font-semibold text-ink mb-2">
                {item.title}
              </h3>
              <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.68]">
                {item.text}
              </p>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {GALLERY_PREVIEW.map((image) => (
            <div
              key={image.src}
              className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[linear-gradient(135deg,#ede7df,#d4cdc3)] shadow-[0_2px_14px_rgba(0,0,0,0.09)]"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted leading-[1.75]">
          Pogledajte{' '}
          <Link
            href="/#bouquets"
            className="text-forest font-medium hover:underline underline-offset-2"
          >
            stvarne bukete
          </Link>
          {' '}koje smo složili za naše kupce.
        </p>
      </div>
    </section>
  )
}

function DeliverySection() {
  return (
    <section
      className="py-20 md:py-28 bg-white"
      aria-labelledby="delivery-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
              Dostava cvijeća Krk
            </p>
            <h2
              id="delivery-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-5 leading-[1.2]"
            >
              Dostava buketa na otoku Krku
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-5">
              Dostavljamo bukete na otoku Krku, uključujući grad Krk, Malinsku i
              okolna naselja. Dostava je besplatna i obavlja se od ponedjeljka do
              subote, uz prethodni dogovor o terminu.
            </p>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-8">
              Uobičajeno nastojimo dostaviti u roku od 24 sata od potvrđene
              narudžbe. Konačni rok ovisi o dostupnosti svježeg cvijeća i
              slobodnim terminima za dostavu. Detalje o području, rokovima i
              načinima plaćanja pronađite na stranici{' '}
              <Link
                href="/dostava-i-placanje"
                className="text-forest font-medium hover:underline underline-offset-2"
              >
                Dostava i plaćanje
              </Link>
              .
            </p>
          </div>

          <div className="bg-cream border-[1.5px] border-divider rounded-3xl p-8">
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">
              Područje dostave na Krku
            </h3>
            <p className="text-sm text-muted mb-5">
              U online narudžbi odaberite opciju Otok Krk. Dostavljamo na:
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Mjesta dostave na Krku">
              {KRK_AREAS.map((area) => (
                <li
                  key={area}
                  className="px-4 py-1.5 rounded-full bg-forest-light border border-forest/[0.14] text-sm font-medium text-forest"
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

function TrustSection() {
  return (
    <section
      className="py-20 md:py-28 bg-cream"
      aria-labelledby="trust-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Zašto Luroni
          </p>
          <h2
            id="trust-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Jednostavno, svježe i po dogovoru
          </h2>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col p-6 sm:p-8 bg-white border-[1.5px] border-divider rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
            >
              <span
                className="flex items-center justify-center w-12 h-12 rounded-full bg-forest-light text-forest mb-5"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <h3 className="font-display text-2xl font-semibold text-ink mb-3">
                {item.title}
              </h3>
              <p className="text-sm sm:text-[0.9375rem] text-muted leading-[1.68]">
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section
      className="py-20 md:py-28 bg-forest"
      aria-labelledby="cta-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 text-center">
        <h2
          id="cta-title"
          className="font-display text-4xl sm:text-[2.75rem] font-semibold text-white mb-5 leading-[1.2] [text-wrap:balance]"
        >
          Naručite buket s dostavom na Krku
        </h2>
        <p className="text-base sm:text-[1.0625rem] text-white/80 leading-[1.75] mb-8 max-w-2xl mx-auto">
          Odaberite veličinu, upišite adresu na otoku Krku i željeni termin.
          Po želji dodajte kratku poruku za osobu kojoj šaljete buket.
        </p>
        <Link
          href="/#order"
          className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-white text-forest font-medium text-[1.0625rem] transition-all hover:bg-forest-light hover:-translate-y-px hover:shadow-lg"
        >
          Naruči buket
        </Link>
      </div>
    </section>
  )
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {children}
    </svg>
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

function GiftIcon() {
  return (
    <Icon>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13" />
      <path d="M3 12h18" />
      <path d="M12 8c-1.5-3-4-4-6-2s-1 4 0 4h6z" />
      <path d="M12 8c1.5-3 4-4 6-2s1 4 0 4h-6z" />
    </Icon>
  )
}

function HeartIcon() {
  return (
    <Icon>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Icon>
  )
}

function SparkleIcon() {
  return (
    <Icon>
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" />
    </Icon>
  )
}

function SurpriseIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </Icon>
  )
}

function StarIcon() {
  return (
    <Icon>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Icon>
  )
}

function FlowerIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9a4 4 0 0 1 0-6 4 4 0 0 1 0 6z" />
      <path d="M12 15a4 4 0 0 0 0 6 4 4 0 0 0 0-6z" />
      <path d="M9 12a4 4 0 0 1-6 0 4 4 0 0 1 6 0z" />
      <path d="M15 12a4 4 0 0 0 6 0 4 4 0 0 0-6 0z" />
    </Icon>
  )
}

function OrderIcon() {
  return (
    <Icon>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </Icon>
  )
}

function DeliveryClockIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  )
}
