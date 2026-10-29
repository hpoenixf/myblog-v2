import Link from 'next/link'
import {
  resolveTag,
  tagLabel,
  tagRoutes,
  tagPageCount,
  canonicalTagUrl,
} from 'lib/tag-taxonomy.mjs'
import { genPageMetadata } from 'app/seo'
import { slug } from 'github-slugger'
import { allCoreContent, sortPosts } from 'pliny/utils/contentlayer'
import ListLayout from '@/layouts/ListLayoutWithTags'
import { allBlogs } from 'contentlayer/generated'
import { isUnmergedPost } from 'lib/blog-visibility.mjs'
import tagData from 'app/tag-data.json'
import { notFound } from 'next/navigation'

const POSTS_PER_PAGE = 10

export const generateStaticParams = async () => {
  const tagCounts = tagData as Record<string, number>
  return tagRoutes(tagCounts).flatMap((tag) => {
    const totalPages = tagPageCount(tag, tagCounts, POSTS_PER_PAGE)
    return Array.from({ length: totalPages }, (_, i) => ({
      tag,
      page: (i + 1).toString(),
    }))
  })
}

export default async function TagPage(props: { params: Promise<{ tag: string; page: string }> }) {
  const params = await props.params
  const tag = decodeURI(params.tag)
  const canonicalTag = resolveTag(tag)
  const title = tagLabel(tag)
  const pageNumber = parseInt(params.page)
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

  // Keep reviewed historical pages, including empty compatibility pages.
  if (
    pageNumber <= 0 ||
    pageNumber > tagPageCount(tag, tagData, POSTS_PER_PAGE) ||
    isNaN(pageNumber)
  ) {
    return notFound()
  }
  const initialDisplayPosts = filteredPosts.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: totalPages,
  }

  return (
    <>
      {tag !== canonicalTag && (
        <p>
          此标签已归并至 <a href={canonicalTagUrl(tag)}>{title}</a>。
        </p>
      )}
      {!initialDisplayPosts.length && (
        <p data-tag-empty>
          此页内容已整理。<a href={canonicalTagUrl(tag)}>查看当前标签内容</a>，或
          <Link href="/blog">浏览博客选集</Link>。
        </p>
      )}
      <ListLayout
        posts={initialDisplayPosts}
        initialDisplayPosts={initialDisplayPosts}
        pagination={pagination}
        title={title}
      />
    </>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string; page: string }>
}) {
  const { tag: raw, page } = await params
  const tag = decodeURI(raw)
  const canonical = resolveTag(tag)
  const currentPages = Math.ceil(
    ((tagData as Record<string, number>)[canonical] ?? 0) / POSTS_PER_PAGE
  )
  const active = Number(page) > 0 && Number(page) <= currentPages
  return genPageMetadata({
    title: tagLabel(tag),
    alternates: {
      canonical: canonicalTagUrl(tag) + (active && Number(page) > 1 ? `/page/${page}` : ''),
    },
    robots: { index: tag === canonical && active, follow: true },
  })
}
