import type { Metadata } from 'next'
import { FAQS } from '@/lib/data'

export const SITE_URL  = 'https://www.luroni-cvijece.com'
export const SITE_NAME = 'Luroni Cvijeće'
export const OG_IMAGE  = '/images/hero/hero-buket.jpg'
export const FLORIST_ID = SITE_URL

export const floristJsonLd = {
  '@context':         'https://schema.org',
  '@type':            'Florist',
  '@id':              FLORIST_ID,
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

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type':    'FAQPage',
    mainEntity: faqs.map(({ question, answer }) => ({
      '@type':        'Question',
      name:           question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

export const homepageFaqJsonLd = faqPageJsonLd(FAQS)

export function floristRef() {
  return { '@id': FLORIST_ID }
}

export function cityLandingJsonLd({
  pageUrl,
  name,
  description,
  breadcrumbName,
  serviceName,
  areaServed,
  faqs,
}: {
  pageUrl: string
  name: string
  description: string
  breadcrumbName: string
  serviceName: string
  areaServed: Array<{ '@type': 'City' | 'Place'; name: string }>
  faqs: { question: string; answer: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Florist',
        '@id':   FLORIST_ID,
        name:    SITE_NAME,
        url:     SITE_URL,
      },
      {
        '@type':      'WebPage',
        '@id':        pageUrl,
        url:          pageUrl,
        name,
        description,
        inLanguage:   'hr-HR',
        isPartOf:     { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
        about:        floristRef(),
        mainEntity:   { '@id': `${pageUrl}#service` },
      },
      {
        '@type':      'Service',
        '@id':        `${pageUrl}#service`,
        name:         serviceName,
        description,
        url:          pageUrl,
        provider:     floristRef(),
        areaServed,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Početna', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: breadcrumbName, item: pageUrl },
        ],
      },
      {
        '@type':     'FAQPage',
        '@id':       `${pageUrl}#faq`,
        mainEntity:  faqs.map(({ question, answer }) => ({
          '@type':        'Question',
          name:           question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  }
}

export function pageSeo({
  title,
  description,
  path,
  index = true,
}: {
  title: string
  description: string
  path: string
  index?: boolean
}): Metadata {
  const url = `${SITE_URL}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(index
      ? {}
      : { robots: { index: false, follow: false } }),
    openGraph: {
      type:        'website',
      locale:      'hr_HR',
      url,
      siteName:    SITE_NAME,
      title,
      description,
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
    },
  }
}
