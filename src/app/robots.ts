import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dalindankapiya.com.tr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Admin dashboard, guest checkout, and API routes carry no SEO value
      // and shouldn't surface in search results — the (admin) layout also
      // sets `robots: noindex` per-route as a second layer of defense.
      disallow: ['/admin', '/dashboard', '/checkout', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
