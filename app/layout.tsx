import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { Analytics }       from '@vercel/analytics/next'
import { GoogleAnalytics } from '@/app/components/GoogleAnalytics'
import { FAQS }            from '@/lib/data'
import './globals.css'

// ── Fonts ──────────────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

// ── Site constants — update here when domain/copy changes ──
const SITE_URL   = 'https://www.luroni-cvijece.com'
const SITE_NAME  = 'Luroni Cvijeće'
const OG_IMAGE   = '/images/hero/hero-buket.jpg'

const TITLE       = 'Dostava cvijeća Rijeka, okolica i Krk | Luroni Cvijeće'
const DESCRIPTION = 'Naručite ručno složene bukete s dostavom u Rijeci, okolici i na otoku Krku. Besplatna dostava, svježe sezonsko cvijeće i dostava u roku 24h.'

// ── Metadata ───────────────────────────────────────────────
export const metadata: Metadata = {
  // Resolves relative paths (e.g. OG images) against the production domain
  metadataBase: new URL(SITE_URL),

  title:       TITLE,
  description: DESCRIPTION,

  keywords: [
    // Primary service keywords
    'dostava cvijeća Rijeka',
    'buket Rijeka',
    'cvjećarnica Rijeka',
    'ručno složeni buketi',
    'sezonsko cvijeće dostava',
    'narudžba buketa online',
    // Surrounding area
    'dostava cvijeća Opatija',
    'buket Opatija',
    'dostava cvijeća Kastav',
    'dostava cvijeća Viškovo',
    'dostava cvijeća Lovran',
    'dostava cvijeća Ičići',
    // Krk island
    'dostava cvijeća Krk',
    'buket Krk',
    'dostava cvijeća otok Krk',
    'cvjećarnica Krk',
    'dostava cvijeća Malinska',
    'dostava cvijeća Dobrinj',
    // Generic
    'svježe cvijeće dostava',
    'buket za rođendan dostava',
    'buket za godišnjicu',
  ],

  // ── Icons ────────────────────────────────────────────────
  // Explicit declarations ensure all browsers and platforms use the correct
  // image regardless of whether Next.js auto-detects the convention file.
  // favicon.ico   → browser tabs, Google search snippets
  // icon.png      → high-res PNG favicon (Chrome, modern browsers)
  // apple-icon    → iOS home-screen / Safari tab icon (180×180)
  icons: {
    // favicon.ico   → browser tabs, bookmarks, Google search snippets
    // apple-icon    → iOS home screen & Safari — served by app/apple-icon.tsx
    icon:     [{ url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
    shortcut: ['/favicon.ico'],
    apple:    [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  authors:   [{ name: SITE_NAME, url: SITE_URL }],
  creator:   SITE_NAME,
  publisher: SITE_NAME,

  // Canonical URL — prevents duplicate-content penalties
  alternates: {
    canonical: SITE_URL,
    languages: { 'hr-HR': SITE_URL },
  },

  // Indexing directives
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:              true,
      follow:             true,
      'max-image-preview':  'large',
      'max-snippet':        -1,
      'max-video-preview':  -1,
    },
  },

  // Open Graph
  openGraph: {
    type:        'website',
    locale:      'hr_HR',
    url:         SITE_URL,
    siteName:    SITE_NAME,
    title:       TITLE,
    description: DESCRIPTION,
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    'Luroni Cvijeće — ručno složeni buketi s dostavom u Rijeci i na Krku',
      },
    ],
  },

  // Twitter / X card
  twitter: {
    card:        'summary_large_image',
    title:       TITLE,
    description: DESCRIPTION,
    images:      [OG_IMAGE],
  },

  // Geo / local-SEO meta tags (Rijeka city centre coordinates)
  other: {
    'geo.region':    'HR-08',
    'geo.placename': 'Rijeka, Hrvatska',
    'geo.position':  '45.3271;14.4422',
    'ICBM':          '45.3271, 14.4422',
    'language':      'Croatian',
    'content-language': 'hr',
  },
}

// ── JSON-LD — Florist / LocalBusiness structured data ────────
const floristJsonLd = {
  '@context':         'https://schema.org',
  '@type':            'Florist',           // more specific than LocalBusiness
  '@id':              SITE_URL,
  name:               SITE_NAME,
  description:        'Ručno složeni buketi s dostavom u Rijeci, okolici i na otoku Krku.',
  url:                SITE_URL,
  image:              `${SITE_URL}${OG_IMAGE}`,
  email:              'info.luroni@gmail.com',
  priceRange:         '€€',
  availableLanguage:  { '@type': 'Language', name: 'Croatian' },
  sameAs:             [],
  areaServed: [
    { '@type': 'City',  name: 'Rijeka'   },
    { '@type': 'City',  name: 'Opatija'  },
    { '@type': 'City',  name: 'Kastav'   },
    { '@type': 'City',  name: 'Viškovo'  },
    { '@type': 'City',  name: 'Lovran'   },
    { '@type': 'City',  name: 'Ičići'    },
    { '@type': 'City',  name: 'Ika'      },
    { '@type': 'City',  name: 'Šmrika'   },
    { '@type': 'City',  name: 'Malinska' },
    { '@type': 'City',  name: 'Dobrinj'  },
    { '@type': 'Place', name: 'Otok Krk' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Buketi s dostavom',
    itemListElement: [
      { '@type': 'Offer', name: 'Buket S', price: '35', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Buket M', price: '45', priceCurrency: 'EUR' },
      { '@type': 'Offer', name: 'Buket L', price: '60', priceCurrency: 'EUR' },
    ],
  },
}

// ── JSON-LD — FAQPage structured data ────────────────────────
const faqJsonLd = {
  '@context':  'https://schema.org',
  '@type':     'FAQPage',
  mainEntity:  FAQS.map(({ question, answer }) => ({
    '@type':        'Question',
    name:           question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
}

// ── Root layout ────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(floristJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-cream text-ink antialiased font-sans">
        {children}
        <Analytics />
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
