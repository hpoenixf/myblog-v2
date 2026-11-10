import './diagram-reading.test.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  digest,
  validateRelease,
  expectedCanonicalEditions,
  expectedHistoricalEditions,
  prepareRelease,
  checkSource,
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
    assert.throws(
      () => checkTopicEntry(good.replace('/eff-agent-article/about', '/about'), page.path),
      /topic entry/
    )
    const own =
      '/eff-agent-article/' + (page.path.startsWith('en/') ? 'en/' : '') + 'open-etf-agent'
    assert.throws(
      () => checkTopicEntry(good.replace(own, '/eff-agent-article/wrong'), page.path),
      /topic entry/
    )
  }
})

const historical = {
  'example-v1': 'example',
  'example-v2': 'example',
  'second-v1': 'second',
}
const historicalEnglish = ['example-v2', 'second-v1']
const fullCollections = [{ chapters: [{ items: [['example', 'Example'], ['second', 'Second']] }] }]
const fullEnglish = ['example', 'second']
const historyPaths = () => expectedHistoricalEditions(fullCollections, fullEnglish, historical, historicalEnglish)
const fullRelease = () => ({
  ...release,
  files: [
    ...expectedCanonicalEditions(fullCollections, fullEnglish).map(path => ({ path, sha256: digest(path) })),
    ...[...historyPaths()].map(([path, canonicalPath]) => ({ path, canonicalPath, sha256: digest(path) })),
  ],
})

test('registered historical full texts add editions without changing canonical counts', () => {
  assert.equal(expectedCanonicalEditions(fullCollections, fullEnglish).length, 4)
  assert.equal(historyPaths().size, 5)
  assert.equal(assertCatalogCoverage(fullRelease(), fullCollections, fullEnglish, historical, historicalEnglish), 9)
  for (const missing of [[...historyPaths().keys()][0], ...historyPaths().keys()]) {
    const partial = fullRelease()
    partial.files = partial.files.filter(file => file.path !== missing)
    assert.throws(() => assertCatalogCoverage(partial, fullCollections, fullEnglish, historical, historicalEnglish), /Missing/)
  }
  const withoutAllHistory = fullRelease()
  withoutAllHistory.files = withoutAllHistory.files.filter(file => !historyPaths().has(file.path))
  assert.throws(() => assertCatalogCoverage(withoutAllHistory, fullCollections, fullEnglish, historical, historicalEnglish), /Missing/)
  assert.equal(assertCatalogCoverage(withoutAllHistory, fullCollections, fullEnglish), 4, 'Old sources without history exports retain their original contract')
  const redirect = fullRelease()
  redirect.files.push({ path: 'articles/compatibility-pointer.md', sha256: digest('pointer') })
  assert.throws(() => assertCatalogCoverage(redirect, fullCollections, fullEnglish, historical, historicalEnglish), /noncanonical/)
})

test('historical whitelist rejects invented English editions, current overlap and invalid targets', () => {
  for (const [map, english] of [
    [historical, ['not-registered']],
    [historical, ['example-v2', 'example-v2']],
    [{ example: 'second' }, []],
    [{ old: 'missing-current' }, []],
    [{ '../private': 'example' }, []],
    [{ old: 'https://other.example/article' }, []],
  ]) assert.throws(() => expectedHistoricalEditions(fullCollections, fullEnglish, map, english))
  assert.throws(() => expectedHistoricalEditions(fullCollections, ['example'], { old: 'second' }, ['old']), /no current English/)
})

test('canonicalPath is not an escape hatch for arbitrary, cross-language or missing targets', () => {
  for (const canonicalPath of [
    'articles/second.md',
    'en/articles/example.md',
    'https://other.example/articles/example',
    '../private.md',
    'articles/missing.md',
    'articles/example-v2.md',
    undefined,
  ]) {
    const changed = fullRelease()
    const file = changed.files.find(file => file.path === 'articles/example-v1.md')
    file.canonicalPath = canonicalPath
    assert.throws(() => assertCatalogCoverage(changed, fullCollections, fullEnglish, historical, historicalEnglish))
  }
  const changedCurrent = fullRelease()
  changedCurrent.files.find(file => file.path === 'articles/example.md').canonicalPath = 'articles/second.md'
  assert.throws(() => assertCatalogCoverage(changedCurrent, fullCollections, fullEnglish, historical, historicalEnglish), /canonical|Canonical/)
  assert.throws(() => checkCanonical(html('articles/example.md').replace('</head>', '<link rel="canonical" href="https://other.example"></head>'), 'articles/example.md'), /one canonical/)
})

test('historical public URL, body hash and canonical target remain independent facts', async () => {
  const oldPath = 'articles/example-v1.md', currentPath = paths[0]
  const oldFile = { path: oldPath, sha256: digest('historical full body'), canonicalPath: currentPath }
  const extended = { ...release, files: [...release.files, oldFile] }
  const oldBody = html(currentPath).replace('Public code', 'Historical full body')
  const record = receipt()
  record.files.push({ path: oldPath, sourceSha256: oldFile.sha256, htmlPath: oldPath.replace(/\.md$/, '.html'), htmlSha256: digest(oldBody) })
  const seen = []
  const read = async url => {
    seen.push(url)
    if (url === baseUrl + oldPath.replace(/\.md$/, '')) return new Response(oldBody)
    return fetcher(record)(url)
  }
  const result = await verifyPublic(extended, { fetcher: read, blogCommit: 'b'.repeat(40) })
  assert.equal(result.files.length, 3)
  assert.ok(seen.includes(baseUrl + oldPath.replace(/\.md$/, '')), 'The historical URL itself is fetched')
  const wrongBody = html(oldPath)
  const wrongRecord = { ...record, files: record.files.map(file => file.path === oldPath ? { ...file, htmlSha256: digest(wrongBody) } : file) }
  await assert.rejects(verifyPublic(extended, { fetcher: async url => url === baseUrl + oldPath.replace(/\.md$/, '') ? new Response(wrongBody) : fetcher(wrongRecord)(url) }), /Wrong canonical/)
  await assert.rejects(verifyPublic(extended, { fetcher: async url => url === baseUrl + oldPath.replace(/\.md$/, '') ? new Response('stale historical body') : fetcher(record)(url) }), /Stale public body/)
})

test('prepare and source verification bind historical membership and canonical to committed source', async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises')
  const { resolve, dirname } = await import('node:path')
  const { execFileSync } = await import('node:child_process')
  const output = resolve('test-output/reader-release-contract')
  await mkdir(output, { recursive: true })
  const root = await mkdtemp(resolve(output, 'source-'))
  const write = async (path, text) => { await mkdir(dirname(resolve(root, path)), { recursive: true }); await writeFile(resolve(root, path), text) }
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  try {
    await write('book.mjs', `export const collections = ${JSON.stringify(fullCollections)}; export const historicalEditions = ${JSON.stringify(historical)};`)
    await write('book.en.mjs', `export const englishArticleSlugs = ${JSON.stringify(fullEnglish)}; export const historicalEnglishArticleSlugs = ${JSON.stringify(historicalEnglish)};`)
    await write('seo-routes.mjs', `import { historicalEditions } from './book.mjs'; export const canonicalUrl = path => { const match = /^(en\\/)?articles\\/([^/]+)\\.md$/.exec(path); return ${JSON.stringify(baseUrl)} + (match[1] || '') + 'articles/' + (historicalEditions[match[2]] || match[2]); };`)
    const paths = fullRelease().files.map(file => file.path)
    for (const path of paths) await write(path, `# Synthetic full-text fixture\n\nBody for ${path}.\n`)
    git('init', '-q'); git('add', '--all')
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Synthetic committed source')
    const prepared = await prepareRelease(root, paths)
    assert.equal(prepared.commit, git('rev-parse', 'HEAD'))
    assert.equal(prepared.files.length, 9)
    assert.equal(prepared.files.filter(file => file.canonicalPath).length, 5)
    await checkSource(root, prepared)
    await assert.rejects(prepareRelease(root, paths.filter(path => !historyPaths().has(path))), /Missing/)
    await assert.rejects(checkSource(root, { ...prepared, commit: 'c'.repeat(40) }), /release pin/)
    const forged = structuredClone(prepared)
    forged.files.find(file => file.path === 'articles/example-v1.md').canonicalPath = 'articles/second.md'
    await assert.rejects(checkSource(root, forged), /Unexpected canonical/)
    // A transitive routing import must not mutate the registered histories before
    // coverage is checked. Reuse this fixture with the new committed dependency.
    await write('language-routing.mjs', 'export const availableEnglishPages = [];')
    const { readFile } = await import('node:fs/promises')
    const originalSeo = await readFile(resolve(root, 'seo-routes.mjs'), 'utf8')
    await write('seo-routes.mjs', "import './language-routing.mjs';\n" + originalSeo)
    git('add', '--all')
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Bind routing dependency')
    const withRouting = await prepareRelease(root, paths)
    await checkSource(root, withRouting)
    await write('language-routing.mjs', "import { historicalEditions } from './book.mjs'; import { historicalEnglishArticleSlugs } from './book.en.mjs'; for (const slug of Object.keys(historicalEditions)) delete historicalEditions[slug]; historicalEnglishArticleSlugs.splice(0);")
    await assert.rejects(checkSource(root, withRouting), /Uncommitted source catalogue: language-routing/)
    await write('language-routing.mjs', 'export const availableEnglishPages = [];')
    // Continue byte-binding tests against the newly committed fixture snapshot.
    prepared.commit = withRouting.commit
    await write('articles/example-v1.md', '# Changed historical body')
    await assert.rejects(checkSource(root, prepared), /Uncommitted article/)
    const forgedBytes = structuredClone(prepared)
    forgedBytes.files.find(file => file.path === 'articles/example-v1.md').sha256 = digest('# Changed historical body')
    await assert.rejects(checkSource(root, forgedBytes), /Uncommitted article/)
    await write('book.mjs', `export const collections = ${JSON.stringify(fullCollections)}; export const historicalEditions = {};`)
    await assert.rejects(checkSource(root, prepared), /Uncommitted source catalogue/)
  } finally { await rm(root, { recursive: true, force: true }) }
})
