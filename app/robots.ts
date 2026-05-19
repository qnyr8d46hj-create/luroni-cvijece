import type { MetadataRoute } from 'next'

const SITE_URL = 'https://www.luroni-cvijece.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  '/api/',   // keep order API endpoints out of search indexes
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
