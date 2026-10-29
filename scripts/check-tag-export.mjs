import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { slug } from 'github-slugger'
import {
  taxonomy,
  resolveTag,
  tagRoutes,
  tagPageCount,
  canonicalTagUrl,
} from '../lib/tag-taxonomy.mjs'
import { checkCuratedExport } from './blog-curation.mjs'

export const reportedTags = Object.keys(taxonomy.historicalCounts)
export function checkTagExport(
  output = 'out',
  counts = JSON.parse(readFileSync('app/tag-data.json', 'utf8')),
  posts = JSON.parse(readFileSync(resolve(output, 'search.json'), 'utf8'))
) {
  const root = resolve(output)
  const htmlFor = (route) => {
    const file = [resolve(root, route + '.html'), resolve(root, route, 'index.html')].find(
      existsSync
    )
    assert.ok(file, 'Missing raw-slug static export: ' + route)
    return readFileSync(file, 'utf8')
  }
  const countFromPosts = {}
  for (const p of posts)
    for (const t of new Set((p.tags ?? []).map((t) => resolveTag(slug(t)))))
      countFromPosts[t] = (countFromPosts[t] ?? 0) + 1
  assert.deepEqual(counts, countFromPosts, 'Tag counts must match visible posts, once per post')
  const articleLinks = (html) =>
    [
      ...new Set(
        [...html.matchAll(/href=["'](?:https:\/\/hpoenixf\.com)?\/blog\/([^"'#?]+)["']/g)].map(
          (m) => decodeURI(m[1]).replace(/\/$/, '')
        )
      ),
    ].sort()
  const checkPage = (route, tag, page) => {
    const html = htmlFor(route)
    const key = resolveTag(tag)
    const selected = posts
      .filter((p) => (p.tags ?? []).some((t) => resolveTag(slug(t)) === key))
      .slice((page - 1) * 10, page * 10)
    assert.deepEqual(
      articleLinks(html),
      selected.map((p) => p.slug ?? p.path.replace(/^blog\//, '')).sort(),
      'Visible article set differs: ' + route
    )
    const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/g) ?? []
    assert.equal(canonical.length, 1, 'One canonical required: ' + route)
    const href = /\bhref=["']([^"']+)["']/.exec(canonical[0])?.[1]
    const url = new URL(href)
    const activePage = Math.ceil((counts[key] ?? 0) / 10) >= page
    const expected = canonicalTagUrl(tag) + (page > 1 && activePage ? `/page/${page}` : '')
    assert.equal(
      decodeURI(url.href).replace(/\/$/, ''),
      decodeURI(expected),
      'Canonical must identify actual tag: ' + route
    )
    assert.ok(!url.pathname.includes('%25'), 'Double-encoded canonical: ' + route)
    if (!selected.length)
      assert.match(
        html,
        /data-tag-empty/,
        'Empty historical route needs an honest migration notice'
      )
    if (tag !== key || !selected.length)
      assert.match(
        html,
        /name=["']robots["'][^>]*content=["'][^"']*noindex/,
        'Compatibility tag must be noindex'
      )
  }
  let paginationPages = 0
  const routes = tagRoutes(counts)
  for (const tag of routes) {
    checkPage('tags/' + tag, tag, 1)
    for (let page = 1; page <= tagPageCount(tag, counts); page++) {
      checkPage(`tags/${tag}/page/${page}`, tag, page)
      paginationPages++
    }
  }
  const rawSlugs = new Set(routes),
    encodedAliases = new Set()
  for (const tag of rawSlugs)
    if ([...tag].some((c) => c.codePointAt(0) > 127)) {
      const once = encodeURIComponent(tag)
      encodedAliases.add(once)
      encodedAliases.add(encodeURIComponent(once))
    }
  for (const entry of readdirSync(resolve(root, 'tags'), { withFileTypes: true })) {
    const key = entry.isDirectory()
      ? entry.name
      : entry.isFile() && entry.name.endsWith('.html')
        ? entry.name.slice(0, -5)
        : null
    if (key && !rawSlugs.has(key))
      assert.ok(!encodedAliases.has(key), 'Encoded export filename: ' + entry.name)
  }
  return { tags: routes.length, paginationPages }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const output = process.argv[2] ?? 'out'
  console.log('Tag static export verified:', checkTagExport(output))
  console.log('Personal blog selection export verified:', checkCuratedExport('.', output))
}
