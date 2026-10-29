import test from 'node:test'
import assert from 'node:assert/strict'
import { renderMigration } from './blog-curation.mjs'
import { readFileSync } from 'node:fs'
import { isUnmergedPost } from '../lib/blog-visibility.mjs'

test('migration projection preserves original identity and cannot silently restore a full body', () => {
  const source =
    "---\ntitle: 'Original title'\ndate: '2020-01-01'\ntags: ['Design']\nlang: zh-CN\n---\nOriginal detailed module body\n"
  const entry = {
    slug: 'example',
    readerUrl: 'https://hpoenixf.com/eff-agent-article/articles/example',
  }
  const page = renderMigration(source, entry)
  assert.ok(page.includes("date: '2020-01-01'"))
  assert.ok(page.includes("title: 'Original title'"))
  assert.ok(page.includes('lang: zh-CN'))
  assert.ok(!page.includes('Original detailed module body'))
  assert.equal(renderMigration(page, entry), page)
  assert.equal(isUnmergedPost({ mergedInto: entry.readerUrl }), false)
  assert.equal(isUnmergedPost({ slug: 'legacy-history' }), true)
  assert.throws(() => renderMigration(source, { ...entry, readerUrl: 'https://example.com/other' }))
})

test('all personal discovery surfaces retain the shared merged-post filter', () => {
  for (const path of [
    'contentlayer.config.ts',
    'scripts/rss.mjs',
    'app/sitemap.ts',
    'app/blog/[...slug]/page.tsx',
    'app/page.tsx',
    'app/blog/page.tsx',
    'app/tags/[tag]/page.tsx',
    'app/tags/[tag]/page/[page]/page.tsx',
  ]) {
    assert.ok(readFileSync(path, 'utf8').includes('isUnmergedPost'), path)
  }
  const detail = readFileSync('app/blog/[...slug]/page.tsx', 'utf8')
  assert.ok(detail.includes('post.canonicalUrl ||'))
  assert.ok(detail.includes('post.mergedInto ? { index: false, follow: true }'))
})
