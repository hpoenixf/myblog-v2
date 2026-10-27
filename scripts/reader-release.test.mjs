import test from 'node:test'
import assert from 'node:assert/strict'
import { digest, validateRelease, checkCanonical, verifyPublic } from './reader-release.mjs'

const baseUrl = 'https://hpoenixf.com/eff-agent-article/'
const paths = ['articles/example.md', 'en/articles/example.md']
const release = {
  schemaVersion: 1,
  repository: 'hpoenixf/eff-agent-article',
  baseUrl,
  commit: 'a'.repeat(40),
  files: paths.map((path) => ({ path, sha256: digest(path) })),
}
const html = (path) =>
  `<html><head><link rel="canonical" href="${baseUrl}${path.replace(/\.md$/, '')}"></head><body>Public code ${path}</body></html>`
const homepages = [
  { path: 'index.md', htmlPath: 'index.html', url: baseUrl },
  { path: 'en/index.md', htmlPath: 'en/index.html', url: baseUrl + 'en/' },
]
const homepageHtml = (page) =>
  `<html><head><link rel="canonical" href="${page.url}"></head><body>Home for ${page.path}</body></html>`
const receipt = () => ({
  schemaVersion: 1,
  repository: release.repository,
  baseUrl,
  sourceCommit: release.commit,
  blogCommit: 'b'.repeat(40),
  files: release.files.map((file) => ({
    path: file.path,
    sourceSha256: file.sha256,
    htmlPath: file.path.replace(/\.md$/, '.html'),
    htmlSha256: digest(html(file.path)),
  })),
  homepages: homepages.map((page) => ({
    path: page.path,
    sourceSha256: digest(page.path),
    htmlPath: page.htmlPath,
    htmlSha256: digest(homepageHtml(page)),
  })),
})
const fetcher =
  (record = receipt(), body = html, code = 200, homeBody = homepageHtml) =>
  async (url) => {
    if (url === baseUrl + 'reader-release.json')
      return new Response(JSON.stringify(record), { status: code })
    const homepage = homepages.find((page) => url === page.url)
    if (homepage) return new Response(homeBody(homepage), { status: code })
    const path = paths.find((path) => url === baseUrl + path.replace(/\.md$/, ''))
    assert.ok(path, 'Only canonical clean URLs should be fetched')
    return new Response(body(path), { status: code })
  }

test('release requires immutable source, canonical domain, unique safe article paths and hashes', () => {
  assert.equal(validateRelease(release), release)
  for (const changed of [
    { commit: 'main' },
    { baseUrl: 'https://hpoenixf.github.io/eff-agent-article/' },
    { repository: 'other/repo' },
    { files: [] },
    { files: [{ path: '../private.md', sha256: 'a'.repeat(64) }] },
    { files: [release.files[0], release.files[0]] },
    { files: [{ path: paths[0], sha256: 'bad' }] },
  ])
    assert.throws(() => validateRelease({ ...release, ...changed }))
})

test('canonical check rejects github.io and wrong article identity', () => {
  checkCanonical(html(paths[0]), paths[0])
  assert.throws(() => checkCanonical(html(paths[1]), paths[0]))
  assert.throws(() =>
    checkCanonical(html(paths[0]).replace('hpoenixf.com', 'hpoenixf.github.io'), paths[0])
  )
  for (const homepage of homepages) checkCanonical(homepageHtml(homepage), homepage.path)
  assert.throws(() => checkCanonical(homepageHtml(homepages[0]), 'en/index.md'))
})

test('each language is verified against its exact public HTML bytes', async () => {
  const result = await verifyPublic(release, { fetcher: fetcher(), blogCommit: 'b'.repeat(40) })
  assert.equal(result.files.length, 2)
})

test('200 with an old body fails even when release receipt is current', async () => {
  await assert.rejects(
    verifyPublic(release, {
      fetcher: fetcher(receipt(), (path) =>
        path.startsWith('en/') ? html(path).replace('Public code', 'Old content') : html(path)
      ),
    }),
    /Stale public body/
  )
})

test('a stale homepage fails even when every article body matches', async () => {
  await assert.rejects(
    verifyPublic(release, {
      fetcher: fetcher(receipt(), html, 200, (page) =>
        page.path === 'index.md'
          ? homepageHtml(page).replace('Home for', 'Previous homepage')
          : homepageHtml(page)
      ),
    }),
    /Stale public homepage/
  )
  const missingHomepage = receipt()
  missingHomepage.homepages.pop()
  await assert.rejects(
    verifyPublic(release, { fetcher: fetcher(missingHomepage) }),
    /Missing homepage receipts/
  )
})

test('stale source, stale deployment, missing edition and wrong source fingerprint fail', async () => {
  for (const edit of [
    (record) => {
      record.sourceCommit = 'c'.repeat(40)
    },
    (record) => {
      record.blogCommit = 'c'.repeat(40)
    },
    (record) => {
      record.files.pop()
    },
    (record) => {
      record.files[0].sourceSha256 = 'c'.repeat(64)
    },
  ]) {
    const record = receipt()
    edit(record)
    await assert.rejects(
      verifyPublic(release, { fetcher: fetcher(record), blogCommit: 'b'.repeat(40) })
    )
  }
})

test('HTTP errors cannot be counted as verified', async () => {
  await assert.rejects(verifyPublic(release, { fetcher: fetcher(receipt(), html, 404) }), /404/)
})

test('retry can converge to a current deployment without changing the expected release', async () => {
  let requests = 0
  const good = fetcher()
  const result = await verifyPublic(release, {
    maxWaitMs: 1000,
    intervalMs: 1,
    fetcher: async (...args) => (++requests === 1 ? new Response('{}') : good(...args)),
  })
  assert.equal(result.sourceCommit, release.commit)
  assert.equal(requests, 6)
})
