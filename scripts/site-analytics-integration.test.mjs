import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
test('blog mounts one client analytics owner and pathname observer', async () => {
  const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  const component = await readFile(
    new URL('../components/SiteAnalytics.tsx', import.meta.url),
    'utf8'
  )
  assert.equal((layout.match(/<SiteAnalytics \/>/g) || []).length, 1)
  assert.match(component, /'use client'/)
  assert.match(component, /mountAnalyticsConsent/)
  assert.match(component, /\[pathname\]/)
  await access(new URL('../lib/site-analytics.mjs', import.meta.url))
})
