import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/app/components/Header'
import { Footer } from '@/app/components/Footer'
import { JsonLd } from '@/app/components/JsonLd'
import { BouquetTypesSection } from '@/app/components/BouquetTypesSection'
import { DELIVERY_AREAS } from '@/lib/data'
import { cityLandingJsonLd } from '@/lib/seo'

const SITE_URL  = 'https://www.luroni-cvijece.com'
const PAGE_PATH = '/dostava-cvijeca-rijeka'
const PAGE_URL  = `${SITE_URL}${PAGE_PATH}`
const SITE_NAME = 'Luroni Cvijeće'
const OG_IMAGE  = '/images/hero/hero-buket.jpg'

const TITLE =
  'Dostava cvijeća Rijeka | Svježi buketi | Luroni'
const DESCRIPTION =
  'Naručite svježe, ručno složene bukete s dostavom u Rijeci i okolici. Odaberite veličinu buketa i naručite online uz Luroni.'

export const metadata: Metadata = {
  title:       TITLE,
  description: DESCRIPTION,
  keywords: [
    'dostava cvijeća Rijeka',
    'dostava buketa Rijeka',
    'buketi Rijeka',
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
        alt:    'Luroni Cvijeće — svježi buketi s dostavom u Rijeci i okolici',
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
    'geo.placename':    'Rijeka, Hrvatska',
    'geo.position':     '45.3271;14.4422',
    ICBM:               '45.3271, 14.4422',
    language:           'Croatian',
    'content-language': 'hr',
  },
}

const HERO_BADGES = [
  { icon: <TruckIcon />,  text: 'Besplatna dostava' },
  { icon: <ClockIcon />,  text: 'Isti dan za narudžbe do 14h' },
  { icon: <MapPinIcon />, text: 'Rijeka i okolica' },
  { icon: <CardIcon />,   text: 'Plaćanje karticom ili gotovinom' },
]

const OCCASIONS = [
  {
    title: 'Rođendani',
    text:  'Razveselite slavljenika svježim buketom. Odaberite veličinu prema prigodi i dojmu koji želite ostaviti.',
    icon:  <GiftIcon />,
  },
  {
    title: 'Pokloni i godišnjice',
    text:  'Buket je lijep izbor za godišnjicu, zahvalu ili znak pažnje. Uz narudžbu možete dodati kratku poruku za karticu.',
    icon:  <HeartIcon />,
  },
  {
    title: 'Iznenađenja i posebne prigode',
    text:  'Naručite online i dogovorite termin dostave u Rijeci. Mi ćemo pripremiti buket i dostaviti ga osobi koju želite iznenaditi.',
    icon:  <SurpriseIcon />,
  },
]

const ORDER_STEPS = [
  'Odaberite veličinu buketa',
  'Unesite podatke za dostavu',
  'Mi pripremamo i dostavljamo buket',
]

const RIJEKA_AREAS = DELIVERY_AREAS.filter(
  (area) => area !== 'Otok Krk i okolica',
)

const TRUST_ITEMS = [
  {
    title: 'Svježe sezonsko cvijeće',
    text:  'Svaki buket slažemo od pažljivo odabranog sezonskog cvijeća. Konačan izgled može blago odstupati ovisno o dostupnosti.',
    icon:  <FlowerIcon />,
  },
  {
    title: 'Ručno složeni buketi',
    text:  'Svaki buket slažemo ručno, pa je svaki aranžman jedinstven i prilagođen sezoni, prigodi i odabranoj veličini.',
    icon:  <SparkleIcon />,
  },
  {
    title: 'Jednostavna online narudžba',
    text:  'Odaberite veličinu buketa, upišite adresu i željeni termin dostave te po želji dodajte kratku poruku za karticu.',
    icon:  <OrderIcon />,
  },
]

const FAQS = [
  {
    question: 'Dostavljate li cvijeće u Rijeci?',
    answer:
      'Da. Dostavljamo bukete na području Rijeke i okolice, uključujući Kastav, Viškovo, Opatiju, Lovran, Ičiće, Iku i Šmriku.',
  },
  {
    question: 'Koliko brzo dostavljate bukete u Rijeci?',
    answer:
      'Bukete dostavljamo u roku 24h, ovisno o dostupnosti svježeg sezonskog cvijeća i dogovorenom terminu dostave.',
  },
  {
    question: 'Kako mogu naručiti i platiti?',
    answer:
      'Naručivanje je online. Odaberite veličinu buketa i upišite podatke za dostavu. Plaćanje je moguće karticom online ili gotovinom prilikom dostave, ovisno o dostupnim opcijama na stranici.',
  },
  {
    question: 'Mogu li dodati poruku uz buket?',
    answer:
      'Da, prilikom narudžbe možete upisati kratku poruku za karticu ili dodatnu napomenu.',
  },
]

const jsonLd = cityLandingJsonLd({
  pageUrl:         PAGE_URL,
  name:            TITLE,
  description:     DESCRIPTION,
  breadcrumbName:  'Dostava cvijeća Rijeka',
  serviceName:     'Dostava cvijeća u Rijeci i okolici',
  areaServed:      RIJEKA_AREAS.map((name) => ({ '@type': 'City' as const, name })),
  faqs:            FAQS,
})

export default function DostavaCvijecaRijekaPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      <main id="top">
        <Hero />
        <IntroSection />
        <OccasionsSection />
        <BouquetTypesSection
          id="velicine"
          titleId="rijeka-velicine-title"
          orderHref="/#order"
          showCustom={false}
          backgroundClassName="bg-cream"
        />
        <OrderingSection />
        <DeliverySection />
        <TrustSection />
        <FaqSection />
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
      aria-labelledby="rijeka-hero-title"
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
            Luroni Cvijeće · Rijeka
          </p>

          <h1
            id="rijeka-hero-title"
            className="font-display text-[2.1rem] sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.14] text-white mb-5 [text-wrap:balance]"
          >
            Dostava cvijeća Rijeka
          </h1>

          <p className="text-base sm:text-[1.125rem] text-white/85 leading-[1.7] mb-4 max-w-[540px]">
            Naručite svježi, ručno složeni buket za rođendan, godišnjicu, poklon,
            iznenađenje ili neki drugi poseban trenutak, uz dostavu u Rijeci i okolici.
          </p>
          <p className="text-base sm:text-[1.125rem] text-white/85 leading-[1.7] mb-9 max-w-[540px]">
            Naručite do 14:00 za dostavu isti dan, ovisno o dostupnosti.
          </p>

          <div className="flex flex-wrap gap-3 mb-11">
            <Link
              href="/#order"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full bg-forest text-white font-medium text-[1.0625rem] transition-all hover:bg-forest-dark hover:-translate-y-px hover:shadow-lg"
            >
              Naruči buket
            </Link>
            <Link
              href="#velicine"
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

function IntroSection() {
  return (
    <section
      className="py-20 md:py-28 bg-cream"
      aria-labelledby="intro-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
              Dostava cvijeća Rijeka
            </p>
            <h2
              id="intro-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-5 leading-[1.2]"
            >
              Svježi buketi s dostavom u Rijeci
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-5">
              Luroni izrađuje svježe, ručno složene bukete od sezonskog cvijeća i
              dostavlja ih u Rijeci i okolici. Odaberite veličinu, upišite adresu
              i naručite online — mi ćemo pripremiti aranžman za vašu prigodu.
            </p>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
              U ponudi su buketi različitih veličina, od manjih buketa do
              raskošnijih aranžmana za posebne prigode. Svaki buket slažemo ručno,
              prema dostupnom sezonskom cvijeću.
            </p>
          </div>

          <div className="relative aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden bg-[linear-gradient(135deg,#ede7df,#d4cdc3)] shadow-[0_2px_14px_rgba(0,0,0,0.09)]">
            <Image
              src="/images/featured-bouquets/buket-m.jpg"
              alt="Svježi ručno složeni buket s dostavom u Rijeci"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function OccasionsSection() {
  return (
    <section
      className="py-20 md:py-28 bg-white"
      aria-labelledby="occasions-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <header className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Buketi za svaku prigodu
          </p>
          <h2
            id="occasions-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-4 leading-[1.2]"
          >
            Zašto naručiti buket
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            U Rijeci dostavljamo ručno složene bukete za rođendane, godišnjice,
            poklone i druge posebne trenutke.
          </p>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OCCASIONS.map((item) => (
            <li
              key={item.title}
              className="flex flex-col p-6 bg-cream border-[1.5px] border-divider rounded-3xl shadow-[0_1px_4px_rgba(0,0,0,0.07)]"
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
      </div>
    </section>
  )
}

function OrderingSection() {
  return (
    <section
      className="py-20 md:py-28 bg-cream"
      aria-labelledby="ordering-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto lg:mx-0 mb-12">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Narudžba
          </p>
          <h2
            id="ordering-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-5 leading-[1.2]"
          >
            Kako naručiti buket
          </h2>
          <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75]">
            Naručivanje je jednostavno. Odaberite veličinu buketa, upišite podatke
            za dostavu i po želji dodajte kratku poruku za osobu kojoj šaljete buket.
          </p>
        </div>

        <ol className="max-w-2xl space-y-3" aria-label="Koraci narudžbe">
          {ORDER_STEPS.map((step, i) => (
            <li
              key={step}
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
              Područje dostave
            </p>
            <h2
              id="delivery-title"
              className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink mb-5 leading-[1.2]"
            >
              Dostava cvijeća u Rijeci i okolici
            </h2>
            <p className="text-base sm:text-[1.0625rem] text-muted leading-[1.75] mb-5">
              Dostavljamo bukete u Rijeci i okolici. Dostava je besplatna i obavlja
              se od ponedjeljka do subote, uz prethodni dogovor o terminu.
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
              . Ako trebate{' '}
              <Link
                href="/cvjecarna-krk"
                className="text-forest font-medium hover:underline underline-offset-2"
              >
                dostavu cvijeća na Krku
              </Link>
              , otvorite stranicu za otok Krk.
            </p>
          </div>

          <div className="bg-cream border-[1.5px] border-divider rounded-3xl p-8">
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">
              Mjesta dostave
            </h3>
            <p className="text-sm text-muted mb-5">Dostavljamo na području:</p>
            <ul className="flex flex-wrap gap-2" aria-label="Mjesta dostave u Rijeci i okolici">
              {RIJEKA_AREAS.map((area) => (
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
            Svježe, ručno i jednostavno
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

function FaqSection() {
  return (
    <section
      className="py-20 md:py-24 bg-white"
      aria-labelledby="faq-title"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto lg:mx-0 mb-12">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] uppercase text-forest mb-3">
            Česta pitanja
          </p>
          <h2
            id="faq-title"
            className="font-display text-4xl sm:text-[2.75rem] font-semibold text-ink leading-[1.2]"
          >
            Dostava cvijeća u Rijeci
          </h2>
        </div>

        <div className="max-w-2xl lg:max-w-none mx-auto grid grid-cols-1 lg:grid-cols-2 lg:gap-x-20">
          {FAQS.map(({ question, answer }) => (
            <div key={question} className="border-b border-divider">
              <h3 className="text-[0.9375rem] font-semibold text-ink leading-snug pt-5 pb-2">
                {question}
              </h3>
              <p className="pb-5 text-[0.9rem] text-muted leading-[1.75]">
                {answer}
              </p>
            </div>
          ))}
        </div>
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
          Naručite buket s dostavom u Rijeci
        </h2>
        <p className="text-base sm:text-[1.0625rem] text-white/80 leading-[1.75] mb-8 max-w-2xl mx-auto">
          Odaberite veličinu, upišite adresu u Rijeci ili okolici i željeni termin.
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
