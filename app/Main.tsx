import Link from '@/components/Link'
import Tag from '@/components/Tag'
import siteMetadata from '@/data/siteMetadata'
import { formatDate } from 'pliny/utils/formatDate'

const MAX_DISPLAY = 10

export default function Home({ posts }) {
  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
          <div className="space-y-3 rounded-lg border border-gray-200 p-5 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Agent 工程专题 · 从前端交互到系统架构
            </h2>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
              面向第一次访问的读者：下列公开工程文章解释 Agent 怎样运行、怎样验证交付，
              以及 Coding Agent 怎样参与长期研发。完整产品源码并未在文集中公开。
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
              <Link href="https://hpoenixf.github.io/eff-agent-article/modules" className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                Agent 具体机制 ↗
              </Link>
              <Link href="https://hpoenixf.github.io/eff-agent-article/thinking" className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                架构与系统思维 ↗
              </Link>
              <Link href="https://hpoenixf.github.io/eff-agent-article/engineering" className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                AI 辅助研发 ↗
              </Link>
              <Link href="/about" className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                作者与阅读路径 ↗
              </Link>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags } = post
            return (
              <li key={slug} className="py-12">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold leading-8 tracking-tight">
                            <Link
                              href={`/blog/${slug}`}
                              className="text-gray-900 dark:text-gray-100"
                            >
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                          {summary}
                        </div>
                      </div>
                      <div className="text-base font-medium leading-6">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                          aria-label={`Read more: "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
    </>
  )
}
