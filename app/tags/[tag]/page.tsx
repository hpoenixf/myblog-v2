import Link from 'next/link'
import { resolveTag, tagLabel, tagRoutes, canonicalTagUrl } from 'lib/tag-taxonomy.mjs'
import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import siteMetadata from '@/data/siteMetadata'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import { isUnmergedPost } from 'lib/blog-visibility.mjs'
import tagData from 'app/tag-data.json'
import { genPageMetadata } from 'app/seo'
import { Metadata } from 'next'

const POSTS_PER_PAGE = 10

export async function generateMetadata(props: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const canonicalTag = resolveTag(tag)
  return genPageMetadata({
    title: tagLabel(tag),
    description: `${siteMetadata.title} ${tag} tagged content`,
    robots: {
      index: tag === canonicalTag && ((tagData as Record<string, number>)[canonicalTag] ?? 0) > 0,
      follow: true,
    },
    alternates: {
      canonical: canonicalTagUrl(tag),
      types: {
        'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
      },
    },
  })
}

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  const tagKeys = tagRoutes(tagCounts)
  return tagKeys.map((tag) => ({
    tag,
  }))
}

export default async function TagPage(props: { params: Promise<{ tag: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const canonicalTag = resolveTag(tag)
  const title = tagLabel(tag)
  const filteredPosts = allCoreContent(
    sortPosts(
      allBlogs.filter(
        (post) =>
          isUnmergedPost(post) &&
          post.tags &&
          post.tags.map((t) => resolveTag(slug(t))).includes(canonicalTag)
      )
    )
  )
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const initialDisplayPosts = filteredPosts.slice(0, POSTS_PER_PAGE)
  const pagination = {
    currentPage: 1,
    totalPages: totalPages,
  }

  return (
    <>
      {tag !== canonicalTag && (
        <p>
          此标签已归并至 <a href={canonicalTagUrl(tag)}>{title}</a>，以下为同一组当前文章。
        </p>
      )}
      {!filteredPosts.length && (
        <p data-tag-empty>
          此标签下的内容已整理。<Link href="/blog">浏览博客选集</Link>，或前往
          <a href="https://hpoenixf.com/eff-agent-article/">完整工程阅读站</a>。
        </p>
      )}
      <ListLayout
        posts={filteredPosts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title={title}
      />
    </>
  )
}
