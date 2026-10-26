import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import SocialIcon from '@/components/social-icons'

export default function Footer() {
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          <SocialIcon kind="mail" href={`mailto:${siteMetadata.email}`} size={6} />
          <SocialIcon kind="github" href={siteMetadata.github} size={6} />
          <SocialIcon kind="linkedin" href={siteMetadata.linkedin} size={6} />
        </div>
        <address className="mb-4 rounded-lg border border-gray-200 px-5 py-3 text-center not-italic dark:border-gray-700">
          <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            联系与合作
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            <a
              href={`mailto:${siteMetadata.email}`}
              className="hover:text-primary-500 dark:hover:text-primary-400"
            >
              邮箱：{siteMetadata.email}
            </a>
            <span>微信：hpoenixf0510</span>
          </div>
        </address>
        <nav
          aria-label="友情链接"
          className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
        >
          <span>友情链接：</span>
          <Link
            href="https://www.peak-lake.com/"
            className="hover:text-primary-500 dark:hover:text-primary-400"
          >
            One PC
          </Link>
        </nav>
        <div className="mb-2 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div>{siteMetadata.author}</div>
          <div>{` • `}</div>
          <div>{`© ${new Date().getFullYear()}`}</div>
          <div>{` • `}</div>
          <Link href="/">{siteMetadata.title}</Link>
        </div>
      </div>
    </footer>
  )
}
