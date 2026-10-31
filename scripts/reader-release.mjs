import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repository = 'hpoenixf/eff-agent-article'
const baseUrl = 'https://hpoenixf.com/eff-agent-article/'
const sha = /^[a-f0-9]{40}$/
const hash = /^[a-f0-9]{64}$/
const articlePath = /^(?:en\/)?articles\/[a-z0-9][a-z0-9-]*\.md$/
const homepageFiles = [
  { path: 'index.md', htmlPath: 'index.html', url: baseUrl },
  { path: 'en/index.md', htmlPath: 'en/index.html', url: baseUrl + 'en/' },
]
const topicPages = [
  { path: 'open-etf-agent.md', htmlPath: 'open-etf-agent.html', url: baseUrl + 'open-etf-agent' },
  {
    path: 'en/open-etf-agent.md',
    htmlPath: 'en/open-etf-agent.html',
    url: baseUrl + 'en/open-etf-agent',
  },
]
function activeElements(html, tagName) {
  const result = []
  function visit(node) {
    if (node.type === 'element') {
      if (['script', 'style', 'template', 'noscript'].includes(node.tagName)) return
      if (node.tagName === tagName) result.push(node.properties ?? {})
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(fromHtmlIsomorphic(html))
  return result
}
export function checkTopicHtml(html, path) {
  const links = activeElements(html, 'link')
  const hasRel = (link, rel) => Array.isArray(link.rel) && link.rel.includes(rel)
  const canonical = links.filter((link) => hasRel(link, 'canonical'))
  assert.equal(canonical.length, 1, `Expected one topic canonical: ${path}`)
  assert.equal(
    canonical[0].href,
    baseUrl + path.replace(/\.md$/, ''),
    `Wrong topic canonical: ${path}`
  )
  for (const [language, url] of [
    ['zh-CN', topicPages[0].url],
    ['en', topicPages[1].url],
  ]) {
    assert.ok(
      links.some(
        (link) => hasRel(link, 'alternate') && link.hrefLang === language && link.href === url
      ),
      `Missing topic hreflang ${language}: ${path}`
    )
  }
}
export function checkTopicEntry(html, path) {
  const anchors = activeElements(html, 'a')
  for (const target of [
    '/eff-agent-article/en/open-etf-agent',
    '/eff-agent-article/open-etf-agent?lang=zh',
  ]) {
    assert.ok(
      anchors.some((anchor) => anchor.href === target),
      `Missing homepage topic entry ${target}: ${path}`
    )
  }
}
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const head = (root) =>
  execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()

export function validateRelease(release) {
  assert.equal(release.schemaVersion, 1, 'Unsupported reader release schema')
  assert.equal(release.repository, repository, 'Unexpected reader source repository')
  assert.equal(release.baseUrl, baseUrl, 'The canonical reader must use hpoenixf.com')
  assert.match(release.commit, sha, 'Reader source must be an immutable commit SHA')
  assert.ok(
    Array.isArray(release.files) && release.files.length,
    'List the exact changed article editions'
  )
  const paths = new Set()
  for (const file of release.files) {
    assert.match(file.path, articlePath, 'Unsafe or unsupported article path')
    assert.match(file.sha256, hash, 'Every article requires its source SHA-256')
    assert.ok(!paths.has(file.path), 'Duplicate article edition')
    paths.add(file.path)
  }
  return release
}

// A clean deployment receipt is only site-complete when every canonical
// Chinese article and every accepted full English edition is in its source lock.
// Historical redirects and the Chinese-original fallback are not separate editions.
export function expectedCanonicalEditions(collections, englishArticleSlugs) {
  assert.ok(Array.isArray(collections), 'Canonical collections must be an array')
  assert.ok(Array.isArray(englishArticleSlugs), 'Accepted English editions must be an array')

  const canonical = collections.flatMap((collection) =>
    collection.chapters.flatMap((chapter) => chapter.items.map(([slug]) => slug))
  )
  assert.ok(canonical.length, 'Canonical catalogue cannot be empty')
  const canonicalSet = new Set(canonical)
  assert.equal(canonicalSet.size, canonical.length, 'Duplicate canonical article slug')
  const englishSet = new Set(englishArticleSlugs)
  assert.equal(englishSet.size, englishArticleSlugs.length, 'Duplicate English article slug')

  for (const slug of canonical) {
    assert.match(slug, /^[a-z0-9][a-z0-9-]*$/, 'Invalid canonical article slug')
  }
  for (const slug of englishArticleSlugs) {
    assert.ok(canonicalSet.has(slug), `English edition has no canonical article: ${slug}`)
  }

  return [
    ...canonical.map((slug) => `articles/${slug}.md`),
    ...englishArticleSlugs.map((slug) => `en/articles/${slug}.md`),
  ].sort()
}

export function assertCatalogCoverage(release, collections, englishArticleSlugs) {
  validateRelease(release)
  const expected = expectedCanonicalEditions(collections, englishArticleSlugs)
  const actual = new Set(release.files.map((file) => file.path))
  const missing = expected.filter((path) => !actual.has(path))
  const expectedSet = new Set(expected)
  const unexpected = [...actual].filter((path) => !expectedSet.has(path)).sort()

  assert.deepEqual(missing, [], 'Missing canonical article editions in reader source lock')
  assert.deepEqual(unexpected, [], 'Reader source lock contains noncanonical editions')
  return expected.length
}

async function sourceCatalog(root) {
  // Import from the checked-out, immutable reader tree, not the blog's own
  // directory or a floating main branch.
  const [book, translated] = await Promise.all([
    import(pathToFileURL(resolve(root, 'book.mjs')).href),
    import(pathToFileURL(resolve(root, 'book.en.mjs')).href),
  ])
  return { collections: book.collections, englishArticleSlugs: translated.englishArticleSlugs }
}

export async function loadRelease(path = 'reader-source.json') {
  return validateRelease(JSON.parse(await readFile(path, 'utf8')))
}

export async function prepareRelease(root, paths) {
  const commit = head(root)
  const files = []
  for (const path of paths) {
    assert.match(path, articlePath, 'Unsafe or unsupported article path')
    const bytes = await readFile(resolve(root, path))
    const committed = execFileSync('git', ['-C', root, 'show', `${commit}:${path}`])
    assert.ok(bytes.equals(committed), `Uncommitted article: ${path}`)
    files.push({ path, sha256: digest(bytes) })
  }
  const release = validateRelease({ schemaVersion: 1, repository, commit, baseUrl, files })
  const { collections, englishArticleSlugs } = await sourceCatalog(root)
  assertCatalogCoverage(release, collections, englishArticleSlugs)
  return release
}

export async function checkSource(root, release) {
  validateRelease(release)
  assert.equal(head(root), release.commit, 'Checked-out reader does not match the release pin')
  const { collections, englishArticleSlugs } = await sourceCatalog(root)
  assertCatalogCoverage(release, collections, englishArticleSlugs)
  for (const file of release.files) {
    assert.equal(
      digest(await readFile(resolve(root, file.path))),
      file.sha256,
      `Stale source: ${file.path}`
    )
  }
}

export function checkCanonical(html, path) {
  const expected =
    homepageFiles.find((entry) => entry.path === path)?.url ?? baseUrl + path.replace(/\.md$/, '')
  const links = html.match(/<link\b[^>]*>/g) ?? []
  assert.ok(
    links.some(
      (link) => /\brel=["']canonical["']/.test(link) && link.includes(`href="${expected}"`)
    ),
    `Wrong canonical: ${path}`
  )
}

export async function stampRelease(root, output, release, blogCommit) {
  await checkSource(root, release)
  assert.match(blogCommit, sha, 'Blog deployment commit must be recorded')
  const files = []
  for (const file of release.files) {
    const htmlPath = file.path.replace(/\.md$/, '.html')
    const bytes = await readFile(resolve(output, htmlPath))
    checkCanonical(bytes.toString('utf8'), file.path)
    files.push({ path: file.path, sourceSha256: file.sha256, htmlPath, htmlSha256: digest(bytes) })
  }
  // Pages are part of the release too; green article checks alone did not
  // catch a stale reader homepage after PR #49.
  const homepages = []
  for (const homepage of homepageFiles) {
    const source = await readFile(resolve(root, homepage.path))
    const committed = execFileSync('git', [
      '-C',
      root,
      'show',
      `${release.commit}:${homepage.path}`,
    ])
    assert.ok(source.equals(committed), `Uncommitted homepage: ${homepage.path}`)
    const html = await readFile(resolve(output, homepage.htmlPath))
    checkCanonical(html.toString('utf8'), homepage.path)
    checkTopicEntry(html.toString('utf8'), homepage.path)
    homepages.push({
      path: homepage.path,
      sourceSha256: digest(source),
      htmlPath: homepage.htmlPath,
      htmlSha256: digest(html),
    })
  }
  const topics = []
  for (const page of topicPages) {
    const source = await readFile(resolve(root, page.path))
    const committed = execFileSync('git', ['-C', root, 'show', `${release.commit}:${page.path}`])
    assert.ok(source.equals(committed), `Uncommitted topic: ${page.path}`)
    const html = await readFile(resolve(output, page.htmlPath))
    checkTopicHtml(html.toString('utf8'), page.path)
    topics.push({
      path: page.path,
      sourceSha256: digest(source),
      htmlPath: page.htmlPath,
      htmlSha256: digest(html),
    })
  }
  const receipt = {
    schemaVersion: 1,
    repository,
    baseUrl,
    sourceCommit: release.commit,
    blogCommit,
    files,
    homepages,
    topics,
  }
  await writeFile(resolve(output, 'reader-release.json'), JSON.stringify(receipt, null, 2) + '\n')
  return receipt
}

export async function verifyPublic(
  release,
  { fetcher = fetch, blogCommit, maxWaitMs = 0, intervalMs = 20000 } = {}
) {
  validateRelease(release)
  const deadline = Date.now() + maxWaitMs
  while (true) {
    try {
      const get = async (url) => {
        const response = await fetcher(url, {
          redirect: 'error',
          signal: AbortSignal.timeout(30000),
          headers: { 'cache-control': 'no-cache' },
        })
        assert.equal(response.status, 200, `Public readback returned ${response.status}: ${url}`)
        return Buffer.from(await response.arrayBuffer())
      }
      const receipt = JSON.parse((await get(baseUrl + 'reader-release.json')).toString('utf8'))
      assert.equal(receipt.schemaVersion, 1)
      assert.equal(receipt.repository, repository)
      assert.equal(receipt.baseUrl, baseUrl)
      assert.equal(
        receipt.sourceCommit,
        release.commit,
        'Canonical deployment is still on an older source'
      )
      assert.match(receipt.blogCommit, sha)
      if (blogCommit)
        assert.equal(
          receipt.blogCommit,
          blogCommit,
          'Canonical deployment is still on an older blog commit'
        )
      assert.equal(receipt.files.length, release.files.length)
      for (const source of release.files) {
        const file = receipt.files.find((entry) => entry.path === source.path)
        assert.ok(file, `Missing public edition: ${source.path}`)
        assert.equal(file.sourceSha256, source.sha256)
        assert.equal(file.htmlPath, source.path.replace(/\.md$/, '.html'))
        assert.match(file.htmlSha256, hash)
        // Verify the clean URL readers actually use, not just the receipt or a cache-busted URL.
        const bytes = await get(baseUrl + source.path.replace(/\.md$/, ''))
        assert.equal(digest(bytes), file.htmlSha256, `Stale public body: ${source.path}`)
        checkCanonical(bytes.toString('utf8'), source.path)
      }
      assert.equal(receipt.homepages?.length, homepageFiles.length, 'Missing homepage receipts')
      for (const homepage of homepageFiles) {
        const page = receipt.homepages.find((entry) => entry.path === homepage.path)
        assert.ok(page, `Missing homepage: ${homepage.path}`)
        assert.match(page.sourceSha256, hash)
        assert.equal(page.htmlPath, homepage.htmlPath)
        assert.match(page.htmlSha256, hash)
        // Verify the exact public root and /en/ that readers visit.
        const bytes = await get(homepage.url)
        assert.equal(digest(bytes), page.htmlSha256, `Stale public homepage: ${homepage.path}`)
        checkCanonical(bytes.toString('utf8'), homepage.path)
        checkTopicEntry(bytes.toString('utf8'), homepage.path)
      }
      assert.equal(receipt.topics?.length, topicPages.length, 'Missing topic receipts')
      for (const topic of topicPages) {
        const page = receipt.topics.find((entry) => entry.path === topic.path)
        assert.ok(page, `Missing topic: ${topic.path}`)
        assert.match(page.sourceSha256, hash)
        assert.equal(page.htmlPath, topic.htmlPath)
        assert.match(page.htmlSha256, hash)
        const bytes = await get(topic.url)
        assert.equal(digest(bytes), page.htmlSha256, `Stale public topic: ${topic.path}`)
        checkTopicHtml(bytes.toString('utf8'), topic.path)
      }
      return receipt
    } catch (error) {
      if (Date.now() >= deadline) throw error
      console.log(`Waiting for canonical deployment: ${error.message}`)
      await new Promise((done) => setTimeout(done, Math.min(intervalMs, deadline - Date.now())))
    }
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'prepare') {
    const [root, ...paths] = args
    const release = await prepareRelease(root, paths)
    await writeFile('reader-source.json', JSON.stringify(release, null, 2) + '\n')
    console.log(`Prepared ${release.files.length} editions at ${release.commit}; not published`)
    return
  }
  const release = await loadRelease()
  if (command === 'pin') console.log(release.commit)
  else if (command === 'source') await checkSource(args[0], release)
  else if (command === 'stamp')
    await stampRelease(args[0], args[1], release, process.env.GITHUB_SHA ?? head('.'))
  else if (command === 'verify') {
    const receipt = await verifyPublic(release, {
      blogCommit: process.env.GITHUB_SHA,
      maxWaitMs: Number(args[0] ?? 0),
    })
    console.log(
      `Canonical reader verified: ${receipt.sourceCommit}; ${receipt.files.length} edition bodies match`
    )
  } else
    throw new Error(
      'Usage: reader-release.mjs prepare <source> <article paths...> | pin | source <source> | stamp <source> <output> | verify [wait-ms]'
    )
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
