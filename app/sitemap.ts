import type { MetadataRoute } from 'next'
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