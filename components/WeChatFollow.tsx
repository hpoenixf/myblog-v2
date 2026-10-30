'use client'

import { usePathname } from 'next/navigation'
import Image from './Image'

export default function WeChatFollow({ placement }: { placement: 'site' | 'article' }) {
  const pathname = usePathname()
  // Article pages own their language-gated end block; do not repeat it in the site footer.
  if (placement === 'site' && pathname?.startsWith('/blog/')) return null

  return (
    <aside
      id="wechat-public-account"
      aria-labelledby="wechat-public-account-title"
      className="not-prose my-6 flex scroll-mt-24 flex-col items-center gap-4 rounded-xl border border-gray-200 p-5 text-center dark:border-gray-700 sm:flex-row sm:text-left"
    >
      <a
        href="/static/images/wechat-public-account.jpg"
        aria-label="查看小飞的 AI 投研工坊微信公众号二维码原图"
      >
        <Image
          src="/static/images/wechat-public-account.jpg"
          alt="小飞的 AI 投研工坊微信公众号关注二维码"
          width={180}
          height={180}
          loading="lazy"
          unoptimized
          className="h-auto max-w-full"
        />
      </a>
      <div>
        <h2 id="wechat-public-account-title" className="text-lg font-semibold">
          微信公众号 · 小飞的 AI 投研工坊
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          扫码关注，在微信里继续阅读 Agent 工程实践。
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          手机端可保存二维码，再在微信中识别。
        </p>
      </div>
    </aside>
  )
}
