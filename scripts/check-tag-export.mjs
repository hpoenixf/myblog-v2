import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Existing Search Console samples, not replacement routes or new landing pages.
export const reportedTags = [
  '工程实践',
  'agent-架构',
  '问题排查',
  '项目',
  '读书笔记',
  'ai-agent-研发工程',
  '投研-agent',
  'ai-agent-研发工程实践',
  '系统架构',
  '金融科技--agent',
  '回顾',
]

export function checkTagExport(
  output = 'out',
  counts = JSON.parse(readFileSync('app/tag-data.json', 'utf8'))
) {
  const root = resolve(output)
  const htmlFor = (route) => {
    const paths = [resolve(root, route + '.html'), resolve(root, route, 'index.html')]
    const file = paths.find(existsSync)
    assert.ok(file, 'Missing raw-slug static export: ' + route)
    return readFileSync(file, 'utf8')
  }
  let checked = 0
  for (const tag of reportedTags) {
    assert.ok(counts[tag] > 0, 'Expected existing content for tag: ' + tag)
    const route = 'tags/' + tag
    const html = htmlFor(route)
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/g) ?? []
    assert.equal(canonical.length, 1, 'One canonical required: ' + route)
    const href = /\bhref=["']([^"']+)["']/.exec(canonical[0])?.[1]
    const url = new URL(href)
    assert.equal(url.origin, 'https://hpoenixf.com', 'Wrong canonical origin')
    assert.equal(
      decodeURIComponent(url.pathname).replace(/\/$/, ''),
      '/' + route,
      'Canonical must identify the once-encoded public tag URL: ' + route
    )
    assert.ok(!url.pathname.includes('%25'), 'Double-encoded canonical: ' + route)
    assert.match(html, /href=["'][^"']*\/blog\//, 'Tag must contain article links: ' + route)
    checked++
  }
  // Detect accidental encoded aliases of known Unicode tags, not legitimate
  // literal-percent slugs or unrelated assets below a tag's directory.
  const rawSlugs = new Set(Object.keys(counts))
  const encodedAliases = new Set()
  for (const tag of rawSlugs) {
    if (![...tag].some((character) => character.codePointAt(0) > 127)) continue
    const once = encodeURIComponent(tag)
    encodedAliases.add(once)
    encodedAliases.add(encodeURIComponent(once))
  }
  for (const entry of readdirSync(resolve(root, 'tags'), { withFileTypes: true })) {
    const routeSlug = entry.isDirectory()
      ? entry.name
      : entry.isFile() && entry.name.endsWith('.html')
        ? entry.name.slice(0, -5)
        : null
    if (routeSlug && !rawSlugs.has(routeSlug)) {
      assert.ok(!encodedAliases.has(routeSlug), 'Encoded export filename: ' + entry.name)
    }
  }

  const multipage = Object.entries(counts).find(([, count]) => count > 10)
  let paginationPages = 0
  if (multipage) {
    const [tag, count] = multipage
    for (let page = 1; page <= Math.ceil(count / 10); page++) {
      const html = htmlFor('tags/' + tag + '/page/' + page)
      assert.match(html, /href=["'][^"']*\/blog\//, 'Pagination must contain articles')
      paginationPages++
    }
  }
  return { tags: checked, paginationTag: multipage?.[0] ?? null, paginationPages }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  console.log('Tag static export verified:', checkTagExport(process.argv[2] ?? 'out'))
}
