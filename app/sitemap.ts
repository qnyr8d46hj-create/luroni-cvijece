import type { MetadataRoute } from 'next'
import { ARTIFICIAL_ARRANGEMENTS_PUBLIC } from '@/lib/artificialArrangementsPublic'
import { ARTIFICIAL_BOUQUET_PAGE_PATH } from '@/lib/artificialBouquetPaths'
import { NN_PRICE_COMPLIANCE_ENABLED } from '@/lib/nnPriceCompliance'

const SITE_URL = 'https://www.luroni-cvijece.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/cvjecarna-krk`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/dostava-cvijeca-rijeka`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  if (ARTIFICIAL_ARRANGEMENTS_PUBLIC) {
    entries.push({
      url: `${SITE_URL}${ARTIFICIAL_BOUQUET_PAGE_PATH}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  if (NN_PRICE_COMPLIANCE_ENABLED) {
    entries.push({
      url: `${SITE_URL}/cjenik`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    })
  }

  return entries
}