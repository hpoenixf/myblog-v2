import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function renderMigration(source, entry) {
  assert.match(entry.slug, /^[a-z0-9][a-z0-9-]*$/)
  assert.equal(entry.readerUrl, `https://hpoenixf.com/eff-agent-article/articles/${entry.slug}`)
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)
  assert.ok(match, `Missing frontmatter: ${entry.slug}`)
  let header = match[1]
    .replace(/^(?:summary|lastmod|mergedInto|canonicalUrl):.*(?:\r?\n|$)/gm, '')
    .trim()
  const title = /^title:\s*(.+)$/m.exec(header)?.[1].replace(/^['"]|['"]$/g, '')
  assert.ok(title && /^date:/m.test(header), 'Preserve original title and publication date')
  header += `\nsummary: '模块机制详解已迁至完整阅读站；个人博客保留系统架构、设计原则与全景文章。'\nlastmod: '2026-10-29'\nmergedInto: '${entry.readerUrl}'\ncanonicalUrl: '${entry.readerUrl}'`
  return `---\n${header}\n---\n\n这篇模块机制详解已迁至完整阅读站：[继续阅读全文](${entry.readerUrl})。\n\n个人博客现聚焦系统架构、设计原则、架构演进与全景文章。模块的实现细节、协议与验证边界继续在阅读站维护；原文与历史修改仍可在 Git 历史中找回。\n\n此页保留原有链接，提供明确的阅读去向，不是 HTTP 301 跳转。后续修订请以阅读站正文为准。\n`
}
export function checkMigrations(root = '.', write = false) {
  const contract = JSON.parse(readFileSync(resolve(root, 'blog-reader-migrations.json'), 'utf8'))
  assert.equal(contract.schemaVersion, 1)
  assert.equal(contract.scope, 'personal-blog-selection-only')
  assert.ok(Array.isArray(contract.migrations))
  const seen = new Set()
  for (const entry of contract.migrations) {
    assert.ok(!seen.has(entry.slug), 'Duplicate migrated slug')
    seen.add(entry.slug)
    const path = resolve(root, `data/blog/${entry.slug}.mdx`)
    const source = readFileSync(path, 'utf8')
    const expected = renderMigration(source, entry)
    if (write) writeFileSync(path, expected)
    else
      assert.equal(
        source,
        expected,
        `Migration projection changed or full body reimported: ${entry.slug}`
      )
  }
  return { migrations: seen.size, scope: contract.scope }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log(checkMigrations(process.argv[2] ?? '.', process.argv.includes('--write')))
}

export function checkCuratedExport(root = '.', output = 'out') {
  const contract = JSON.parse(readFileSync(resolve(root, 'blog-reader-migrations.json'), 'utf8'))
  const read = (route) => readFileSync(resolve(output, route), 'utf8')
  const discoverable = ['index.html', 'blog.html', 'feed.xml', 'sitemap.xml'].map(read)
  const search = JSON.parse(read('search.json'))
  for (const e of contract.migrations) {
    assert.ok(
      !search.some((p) => p.slug === e.slug || p.path === `blog/${e.slug}`),
      'Migrated article leaked into search'
    )
    for (const html of discoverable)
      assert.ok(
        !html.includes(`/blog/${e.slug}"`) && !html.includes(`/blog/${e.slug}<`),
        `Migrated article leaked into discovery: ${e.slug}`
      )
    const html = read(`blog/${e.slug}.html`)
    assert.ok(html.includes(`href="${e.readerUrl}"`), 'Missing actual reader destination')
    assert.match(html, /name=["']robots["'][^>]*content=["'][^"']*noindex/)
    assert.ok(html.includes('继续阅读全文'), 'Missing migration message')
    assert.match(html, new RegExp('<link[^>]*rel="canonical"[^>]*href="' + e.readerUrl + '"'))
  }
  return { migrations: contract.migrations.length, staticOnly: true }
}
