import './diagram-reading.test.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  digest,
  validateRelease,
  expectedCanonicalEditions,
  assertCatalogCoverage,
  checkCanonical,
  verifyPublic,
  checkTopicHtml,
  checkTopicEntry,
} from './reader-release.mjs'

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
  `<html><head><link rel="canonical" href="${page.url}"></head><body>Home for ${page.path}<a href="/eff-agent-article/${page.path.startsWith('en/') ? 'en/' : ''}open-etf-agent">Topic</a><a href="/eff-agent-article/about">About</a></body></html>`
const topics = ['open-etf-agent.md', 'en/open-etf-agent.md']
const topicHtml = (path) =>
  html(path).replace(
    '</head>',
    `<link rel="alternate" hreflang="zh-CN" href="${baseUrl}open-etf-agent"><link rel="alternate" hreflang="en" href="${baseUrl}en/open-etf-agent"></head>`
  )
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
  topics: topics.map((path) => ({
    path,
    sourceSha256: digest(path),
    htmlPath: path.replace(/\.md$/, '.html'),
    htmlSha256: digest(topicHtml(path)),
  })),
  homepages: homepages.map((page) => ({
    path: page.path,
    sourceSha256: digest(page.path),
    htmlPath: page.htmlPath,
    htmlSha256: digest(homepageHtml(page)),
  })),
})
const fetcher =
  (record = receipt(), body = html, code = 200, homeBody = homepageHtml, topicBody = topicHtml) =>
  async (url) => {
    if (url === baseUrl + 'reader-release.json')
      return new Response(JSON.stringify(record), { status: code })
    const homepage = homepages.find((page) => url === page.url)
    if (homepage) return new Response(homeBody(homepage), { status: code })
    const topic = topics.find((path) => url === baseUrl + path.replace(/\.md$/, ''))
    if (topic) return new Response(topicBody(topic), { status: code })
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

test('canonical lock must cover every Chinese article and every accepted English edition', () => {
  const collections = [
    {
      chapters: [
        {
          items: [
            ['example', 'Example'],
            ['second', 'Second'],
          ],
        },
      ],
    },
  ]
  const english = ['example', 'second']
  const paths = [
    'articles/example.md',
    'articles/second.md',
    'en/articles/example.md',
    'en/articles/second.md',
  ]
  const expectedPaths = expectedCanonicalEditions(collections, english)
  assert.deepEqual(expectedPaths, [...paths].sort())

  const files = paths.map((path) => ({ path, sha256: digest(path) }))
  const complete = { ...release, files }
  assert.equal(assertCatalogCoverage(complete, collections, english), 4)

  const omit = (path) => ({
    ...complete,
    files: files.filter((file) => file.path !== path),
  })
  const omittedChinese = omit('articles/second.md')
  assert.equal(validateRelease(omittedChinese), omittedChinese)
  for (const path of ['articles/second.md', 'en/articles/second.md']) {
    assert.throws(
      () => assertCatalogCoverage(omit(path), collections, english),
      /Missing canonical article editions/
    )
  }

  const oldPage = {
    path: 'articles/old-redirect.md',
    sha256: digest('old'),
  }
  const withOldPage = { ...complete, files: [...files, oldPage] }
  assert.throws(
    () => assertCatalogCoverage(withOldPage, collections, english),
    /noncanonical editions/
  )

  const unknownEnglish = ['example', 'no-such-article']
  assert.throws(
    () => expectedCanonicalEditions(collections, unknownEnglish),
    /no canonical article/
  )
  const duplicateEnglish = ['example', 'example']
  assert.throws(
    () => expectedCanonicalEditions(collections, duplicateEnglish),
    /Duplicate English article/
  )
  const duplicateItems = [['example'], ['example']]
  const duplicateCatalog = [{ chapters: [{ items: duplicateItems }] }]
  assert.throws(
    () => expectedCanonicalEditions(duplicateCatalog, []),
    /Duplicate canonical article/
  )
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
  assert.equal(requests, 8)
})

test('topic canonical and bilingual alternates fail closed', () => {
  for (const path of topics) {
    checkTopicHtml(topicHtml(path), path)
    assert.throws(
      () => checkTopicHtml(topicHtml(path).replace('hreflang="en"', 'hreflang="fr"'), path),
      /hreflang/
    )
    assert.throws(
      () => checkTopicHtml(topicHtml(path).replace('rel="canonical"', 'rel="wrong"'), path),
      /canonical/
    )
  }
  assert.throws(
    () => checkTopicEntry('<a href="/open-etf-agent">bad base</a>', 'index.md'),
    /topic entry/
  )
})
test('missing topic or stale public topic cannot hide behind current article receipts', async () => {
  const missing = receipt()
  missing.topics.pop()
  await assert.rejects(
    verifyPublic(release, { fetcher: fetcher(missing) }),
    /Missing topic receipts/
  )
  await assert.rejects(
    verifyPublic(release, {
      fetcher: fetcher(receipt(), html, 200, homepageHtml, (path) => topicHtml(path) + 'old'),
    }),
    /Stale public topic/
  )
  const noLocale = (path) => topicHtml(path).replace('hreflang="en"', 'hreflang="fr"')
  const r = receipt()
  r.topics.forEach((t) => (t.htmlSha256 = digest(noLocale(t.path))))
  await assert.rejects(
    verifyPublic(release, { fetcher: fetcher(r, html, 200, homepageHtml, noLocale) }),
    /hreflang/
  )
})
test('matching homepage receipt still requires actual topic entrance', async () => {
  const body = (page) =>
    homepageHtml(page).replace('/eff-agent-article/en/open-etf-agent', '/wrong')
  const r = receipt()
  r.homepages.forEach(
    (p) => (p.htmlSha256 = digest(body(homepages.find((h) => h.path === p.path))))
  )
  await assert.rejects(
    verifyPublic(release, { fetcher: fetcher(r, html, 200, body) }),
    /topic entry/
  )
})

test('topic gates reject data attributes and inert markup', () => {
  const page = homepages[0],
    home = homepageHtml(page),
    topic = topicHtml(topics[0])
  assert.throws(
    () => checkTopicEntry(home.replaceAll('href=', 'data-href='), page.path),
    /topic entry/
  )
  assert.throws(
    () => checkTopicHtml(topic.replaceAll('hreflang=', 'data-hreflang='), topics[0]),
    /hreflang/
  )
  assert.throws(
    () => checkTopicHtml(topic.replaceAll('href=', 'data-href='), topics[0]),
    /canonical/
  )
  for (const wrap of [
    (text) => '<!--' + text + '-->',
    (text) => '<script>' + text + '</script>',
    (text) => '<template>' + text + '</template>',
    (text) => '<noscript>' + text + '</noscript>',
  ]) {
    assert.throws(
      () =>
        checkTopicEntry(
          '<body>' + wrap(home.match(/<a\b[^>]*>.*?<\/a>/g).join('')) + '</body>',
          page.path
        ),
      /topic entry/
    )
    assert.throws(
      () => checkTopicHtml(wrap(topic.match(/<link\b[^>]*>/g).join('')), topics[0]),
      /canonical/
    )
  }
})

test('homepage discovery requires its own language topic and the About tab', () => {
  for (const page of homepages) {
    const good = homepageHtml(page)
    checkTopicEntry(good, page.path)
    assert.throws(() => checkTopicEntry(good.replace('/eff-agent-article/about', '/about'), page.path), /topic entry/)
    const own = '/eff-agent-article/' + (page.path.startsWith('en/') ? 'en/' : '') + 'open-etf-agent'
    assert.throws(() => checkTopicEntry(good.replace(own, '/eff-agent-article/wrong'), page.path), /topic entry/)
  }
})
