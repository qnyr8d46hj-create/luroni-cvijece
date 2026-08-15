import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.luroni-cvijece.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              SITE_URL,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1,
    },
    {
      url:              `${SITE_URL}/buketi`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.8,
    },
  ]
}
