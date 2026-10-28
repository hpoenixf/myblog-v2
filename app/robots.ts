import { MetadataRoute } from 'next'
import siteMetadata from '@/data/siteMetadata'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = siteMetadata.siteUrl.replace(/\/+$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/eff-agent-article/sitemap.xml`],
    host: siteUrl,
  }
}
