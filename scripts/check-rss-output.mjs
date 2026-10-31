import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import siteMetadata from '../data/siteMetadata.js'

const output = process.argv[2] ?? 'out'
const base = siteMetadata.siteUrl.replace(/\/+$/, '')
const root = new URL(base).origin
const feed = readFileSync(resolve(output, 'feed.xml'), 'utf8')
const sitemap = readFileSync(resolve(output, 'sitemap.xml'), 'utf8')

assert.ok(
  feed.includes(`<link>${base}/blog</link>`),
  'RSS channel must point to canonical blog URL'
)
assert.ok(feed.includes(`<atom:link href="${base}/feed.xml"`), 'RSS self-link must be canonical')
const rssLinks = [...feed.matchAll(/<(?:guid|link)>([^<]+)<\/(?:guid|link)>/g)].map((m) => m[1])
const sitemapLinks = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
assert.ok(rssLinks.length > 2, 'RSS must include published article URLs')
assert.ok(sitemapLinks.length > 4, 'Sitemap must include published article URLs')
for (const [kind, links] of [
  ['RSS', rssLinks],
  ['sitemap', sitemapLinks],
]) {
  for (const value of links) {
    const url = new URL(value)
    assert.equal(url.origin, root, `${kind} URL must stay on canonical host: ${value}`)
    assert.ok(!url.pathname.includes('//'), `${kind} URL has duplicate slash: ${value}`)
  }
}
console.log(`Canonical URLs checked: RSS ${rssLinks.length}; sitemap ${sitemapLinks.length}`)
