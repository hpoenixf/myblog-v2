import { MetadataRoute } from 'next'
import { allBlogs } from 'contentlayer/generated'
import { isUnmergedPost } from 'lib/blog-visibility.mjs'
import siteMetadata from '@/data/siteMetadata'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteMetadata.siteUrl.replace(/\/+$/, '')

  const blogRoutes = allBlogs
    .filter((post) => !post.draft && isUnmergedPost(post))
    .map((post) => ({
      url: `${siteUrl}/${post.path}`,
      lastModified: post.lastmod || post.date,
    }))

  const routes = ['', 'blog', 'projects', 'tags'].map((route) => ({
    url: `${siteUrl}/${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogRoutes]
}
