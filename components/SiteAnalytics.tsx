'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createAnalytics, mountAnalyticsConsent } from '../lib/site-analytics.mjs'

export default function SiteAnalytics() {
  const pathname = usePathname()
  useEffect(() => mountAnalyticsConsent(window, document), [])
  useEffect(() => {
    createAnalytics(window, document)?.pageView()
  }, [pathname])
  return null
}
