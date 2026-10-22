import { sortPosts, allCoreContent } from 'pliny/utils/contentlayer'
import { allBlogs } from 'contentlayer/generated'
import { isUnmergedPost } from 'lib/blog-visibility.mjs'
import Main from './Main'

export default async function Page() {
  const sortedPosts = sortPosts(allBlogs.filter(isUnmergedPost))
  const posts = allCoreContent(sortedPosts)
  return <Main posts={posts} />
}
