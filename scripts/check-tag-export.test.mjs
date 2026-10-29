import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { slug } from 'github-slugger'
import { checkTagExport } from './check-tag-export.mjs'
import {
  taxonomy,
  tagLabel,
  resolveTag,
  tagRoutes,
  tagPageCount,
  canonicalTagUrl,
} from '../lib/tag-taxonomy.mjs'

test('both actual static-param generators retain raw current and historical slugs and pages', async () => {
  const counts = { 工程实践: 1, 'etf-agent': 36 }
  for (const path of ['app/tags/[tag]/page.tsx', 'app/tags/[tag]/page/[page]/page.tsx']) {
    const source = readFileSync(path, 'utf8')
    const expression = /export const generateStaticParams = (async \(\) => \{[\s\S]*?\n\})/.exec(
      source
    )?.[1]
    assert.ok(expression, path)
    const build = new Function(
      'tagData',
      'POSTS_PER_PAGE',
      'tagRoutes',
      'tagPageCount',
      'return (' + expression.replace(' as Record<string, number>', '') + ')'
    )
    const rows = await build(counts, 10, tagRoutes, tagPageCount)()
    for (const tag of tagRoutes(counts)) {
      const matches = rows.filter((row) => row.tag === tag)
      assert.equal(matches.length, path.includes('[page]') ? tagPageCount(tag, counts) : 1)
    }
    const chinese = rows.find((r) => r.tag === '工程实践').tag
    assert.equal(encodeURIComponent(chinese), '%E5%B7%A5%E7%A8%8B%E5%AE%9E%E8%B7%B5')
    assert.ok(!encodeURIComponent(chinese).includes('%25'))
  }
})

test('reviewed aliases resolve directly; canonical labels are not broad semantic mergers', () => {
  for (const [old, target] of Object.entries(taxonomy.aliases)) {
    assert.equal(resolveTag(target), target, `Alias chain/cycle at ${old}`)
    assert.ok(tagRoutes({}).includes(target))
  }
  for (const old of Object.keys(taxonomy.historicalCounts)) assert.ok(tagRoutes({}).includes(old))
  assert.equal(resolveTag('回顾'), '年度回顾')
  assert.equal(resolveTag('优化'), '性能优化')
  assert.notEqual(resolveTag('etf-agent'), resolveTag('ai-agent'))
  assert.notEqual(resolveTag('金融科技--agent'), resolveTag('投研-agent'))
  assert.notEqual(resolveTag('工程实践'), resolveTag('ai-agent-研发工程'))
})

test('export gate proves visible identity sets, deduplicated counts, canonical aliases and honest empty routes', () => {
  const root = mkdtempSync(resolve('.tag-export-test-'))
  const posts = Array.from({ length: 12 }, (_, i) => ({
    slug: 'entry-' + i,
    tags: ['ETF Agent', 'ETF Agent'],
  }))
  const counts = { 'etf-agent': posts.length }
  const put = (route, body) => {
    const p = resolve(root, route + '.html')
    mkdirSync(resolve(p, '..'), { recursive: true })
    writeFileSync(p, body)
  }
  const body = (tag, page) => {
    const key = resolveTag(tag),
      selected = key === 'etf-agent' ? posts.slice((page - 1) * 10, page * 10) : []
    const active = page <= Math.ceil((counts[key] ?? 0) / 10)
    const canonical = canonicalTagUrl(tag) + (page > 1 && active ? '/page/' + page : '')
    return (
      '<link rel="canonical" href="' +
      canonical +
      '">' +
      (tag !== key || !selected.length ? '<meta name="robots" content="noindex, follow">' : '') +
      (selected.length
        ? selected.map((p) => '<a href="/blog/' + p.slug + '">Article</a>').join('')
        : '<p data-tag-empty>Content organized</p>')
    )
  }
  try {
    for (const tag of tagRoutes(counts)) {
      put('tags/' + tag, body(tag, 1))
      for (let p = 1; p <= tagPageCount(tag, counts); p++)
        put(`tags/${tag}/page/${p}`, body(tag, p))
    }
    const result = checkTagExport(root, counts, posts)
    assert.equal(result.tags, tagRoutes(counts).length)
    assert.throws(() => checkTagExport(root, { 'etf-agent': 24 }, posts), /once per post/)
    put('tags/工程实践/assets/figure%20wide', 'unrelated asset')
    assert.doesNotThrow(() => checkTagExport(root, counts, posts))
    const encoded = encodeURIComponent('工程实践')
    put('tags/' + encoded, 'wrong encoded filename')
    assert.throws(() => checkTagExport(root, counts, posts), /Encoded export filename/)
    rmSync(resolve(root, 'tags/' + encoded + '.html'))
    put('tags/' + encodeURIComponent(encoded), 'wrong double-encoded filename')
    assert.throws(() => checkTagExport(root, counts, posts), /Encoded export filename/)
    rmSync(resolve(root, 'tags/' + encodeURIComponent(encoded) + '.html'))
    put('tags/回顾', body('回顾', 1) + '<a href="/blog/migrated-module">Hidden</a>')
    assert.throws(() => checkTagExport(root, counts, posts), /Visible article set differs/)
    put('tags/回顾', body('回顾', 1).replace(encodeURIComponent('年度回顾'), 'wrong'))
    assert.throws(() => checkTagExport(root, counts, posts), /Canonical must identify/)
    put('tags/回顾', body('回顾', 1))
    rmSync(resolve(root, 'tags/回顾.html'))
    assert.throws(() => checkTagExport(root, counts, posts), /Missing raw-slug/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('production tag counter lowercases every position and counts each post once', async () => {
  const source = readFileSync('contentlayer.config.ts', 'utf8')
  const code = /async function createTagCount\(allBlogs\) \{[\s\S]*?\n\}/.exec(source)?.[0]
  assert.ok(code)
  let output
  const count = new Function(
    'slug',
    'resolveTag',
    'isUnmergedPost',
    'isProduction',
    'prettier',
    'writeFileSync',
    'return (' +
      code.replace(': Record<string, number>', '').replace('new Set<string>', 'new Set') +
      ')'
  )(
    slug,
    resolveTag,
    (p) => !p.mergedInto,
    true,
    { format: async (text) => text },
    (_path, text) => {
      output = JSON.parse(text)
    }
  )
  await count([
    { tags: ['ETF Agent', 'AI Agent', 'Relay', 'ETF Agent'] },
    { tags: ['ETF Agent'], mergedInto: 'reader' },
  ])
  assert.deepEqual(output, { 'etf-agent': 1, 'ai-agent': 1, relay: 1 })
})
