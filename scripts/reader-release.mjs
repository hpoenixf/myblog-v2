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
  return validateRelease({ schemaVersion: 1, repository, commit, baseUrl, files })
}

export async function checkSource(root, release) {
  validateRelease(release)
  assert.equal(head(root), release.commit, 'Checked-out reader does not match the release pin')
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
    homepageFiles.find((entry) => entry.path === path)?.url ??
    baseUrl + path.replace(/\.md$/, '')
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
    const committed = execFileSync('git', ['-C', root, 'show', `${release.commit}:${homepage.path}`])
    assert.ok(source.equals(committed), `Uncommitted homepage: ${homepage.path}`)
    const html = await readFile(resolve(output, homepage.htmlPath))
    checkCanonical(html.toString('utf8'), homepage.path)
    homepages.push({
      path: homepage.path,
      sourceSha256: digest(source),
      htmlPath: homepage.htmlPath,
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
