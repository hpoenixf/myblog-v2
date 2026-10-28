import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkTagExport, reportedTags } from './check-tag-export.mjs'

test('both actual static-param generators return raw slugs for Next to encode once', async () => {
  for (const path of ['app/tags/[tag]/page.tsx', 'app/tags/[tag]/page/[page]/page.tsx']) {
    const source = readFileSync(path, 'utf8')
    const expression = /export const generateStaticParams = (async \(\) => \{[\s\S]*?\n\})/.exec(
      source
    )?.[1]
    assert.ok(expression, path)
    const build = new Function(
      'tagData',
      'POSTS_PER_PAGE',
      'return (' + expression.replace(' as Record<string, number>', '') + ')'
    )
    const rows = await build(
      { 工程实践: 1, 'etf-agent': 36 },
      Number(/const POSTS_PER_PAGE = (\d+)/.exec(source)[1])
    )()
    assert.equal(rows[0].tag, '工程实践')
    // Next 15.1.4 buildStaticPaths encodes each dynamic parameter itself.
    assert.equal(encodeURIComponent(rows[0].tag), '%E5%B7%A5%E7%A8%8B%E5%AE%9E%E8%B7%B5')
    assert.ok(!encodeURIComponent(rows[0].tag).includes('%25'))
    if (path.includes('[page]'))
      assert.equal(rows.filter((row) => row.tag === 'etf-agent').length, 4)
  }
})

test('export gate verifies tags/canonicals/pagination and rejects encoded filenames', () => {
  const root = mkdtempSync(resolve('.tag-export-test-'))
  const counts = Object.fromEntries(reportedTags.map((tag) => [tag, 1]))
  counts['etf-agent'] = 36
  const put = (route, body) => {
    const file = resolve(root, route + '.html')
    mkdirSync(resolve(file, '..'), { recursive: true })
    writeFileSync(file, body)
  }
  try {
    for (const tag of reportedTags)
      put(
        'tags/' + tag,
        '<link rel="canonical" href="https://hpoenixf.com/tags/' +
          encodeURIComponent(tag) +
          '"><a href="/blog/example">Article</a>'
      )
    for (let page = 1; page <= 4; page++)
      put('tags/etf-agent/page/' + page, '<a href="/blog/example">Article</a>')
    assert.deepEqual(checkTagExport(root, counts), {
      tags: 11,
      paginationTag: 'etf-agent',
      paginationPages: 4,
    })
    counts['growth%20'] = 1
    put('tags/growth%20', 'A legitimate literal-percent raw slug')
    put('tags/工程实践/assets/figure%20wide', 'Unrelated asset, not a tag route')
    assert.doesNotThrow(() => checkTagExport(root, counts))
    const encoded = encodeURIComponent('工程实践')
    counts[encoded] = 1 // A literal-percent raw key wins over alias detection.
    put('tags/' + encoded, 'A legitimate raw key, despite looking encoded')
    assert.doesNotThrow(() => checkTagExport(root, counts))
    delete counts[encoded]

    assert.throws(() => checkTagExport(root, counts), /Encoded export filename/)
    rmSync(resolve(root, 'tags/' + encoded + '.html'))
    const twice = encodeURIComponent(encoded)
    put('tags/' + twice, 'wrong double-encoded path')
    assert.throws(() => checkTagExport(root, counts), /Encoded export filename/)
    rmSync(resolve(root, 'tags/' + twice + '.html'))
    put(
      'tags/工程实践',
      '<link rel="canonical" href="https://hpoenixf.com/tags/%25E5%25B7%25A5"><a href="/blog/example">Article</a>'
    )
    assert.throws(() => checkTagExport(root, counts), /Canonical must identify/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
