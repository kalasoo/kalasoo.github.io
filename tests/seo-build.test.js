import assert from 'node:assert/strict'
import { access, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'dist')

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return htmlFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : []
  }))
  return nested.flat()
}

function jsonLdObjects(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
    .map(match => JSON.parse(match[1]))
}

test('draft content is absent from production outputs', async () => {
  assert.equal(await exists(path.join(distDir, 'test.html')), false)

  const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
  assert.doesNotMatch(sitemap, /yinming\.me\/test(?:<|$)/)
})

test('every indexable page has complete, unambiguous metadata', async () => {
  const files = (await htmlFiles(distDir))
    .filter(file => path.basename(file) !== '404.html')

  assert.equal(files.length, 7)

  for (const file of files) {
    const html = await readFile(file, 'utf8')
    const relativePath = path.relative(distDir, file)

    assert.match(html, /<title>[^<]+<\/title>/, relativePath)
    assert.match(html, /<meta name="description" content="[^"]+">/, relativePath)
    assert.match(html, /<link rel="canonical" href="https:\/\/yinming\.me[^"]*">/, relativePath)
    assert.match(html, /<link rel="icon" type="image\/png" href="\/icon\.png">/, relativePath)
    assert.match(html, /<link rel="alternate" type="application\/rss\+xml"[^>]+href="\/rss\.xml">/, relativePath)
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, relativePath)
    assert.doesNotMatch(html, /<time(?![^>]*\sdatetime=)[^>]*>/, relativePath)

    const structuredData = jsonLdObjects(html)
    assert.equal(structuredData.length, 1, relativePath)
    assert.equal(structuredData[0]['@context'], 'https://schema.org', relativePath)

    if (relativePath !== 'index.html') {
      assert.match(html, /<div class="site-title"><a href="\/">@kalasoo<\/a><\/div>/, relativePath)
      const documentTitle = html.match(/<title>([^<]+)<\/title>/)[1]
      const pageHeading = html.match(/<h1[^>]*>([^<]+)<\/h1>/)[1]
      assert.equal(documentTitle, pageHeading, `${relativePath} title must match its page heading`)
    }
  }
})

test('page-specific search metadata and schemas are emitted', async () => {
  const home = await readFile(path.join(distDir, 'index.html'), 'utf8')
  assert.match(home, /<title>阴明 kalasoo<\/title>/)
  assert.equal(jsonLdObjects(home)[0]['@type'], 'WebSite')

  const about = await readFile(path.join(distDir, 'about.html'), 'utf8')
  assert.match(about, /<title>About<\/title>/)
  assert.equal(jsonLdObjects(about)[0]['@type'], 'ProfilePage')

  const article = await readFile(
    path.join(distDir, 'posts', 'reflections-on-vibe-coding-2025.html'),
    'utf8'
  )
  assert.match(article, /<title>2025 年的 Vibe Coding 思考｜Reflections on Vibe Coding in 2025<\/title>/)
  const articleData = jsonLdObjects(article)[0]
  assert.equal(articleData['@type'], 'BlogPosting')
  assert.equal(articleData.author.name, 'Yin Ming')
  assert.deepEqual(articleData.author.sameAs, [
    'https://github.com/kalasoo',
    'https://x.com/kalasoo',
    'https://t.me/kalasoo'
  ])
  assert.equal(articleData.image, undefined)
})

test('sitemap contains only canonical URLs and accurate modification dates', async () => {
  const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')

  assert.equal((sitemap.match(/<url>/g) || []).length, 7)
  assert.doesNotMatch(sitemap, /<(?:priority|changefreq)>/)
  assert.match(sitemap, /<loc>https:\/\/yinming\.me\/posts<\/loc>\s*<lastmod>2025-11-17<\/lastmod>/)
  assert.match(sitemap, /<loc>https:\/\/yinming\.me\/posts\/one-person-unicorn<\/loc>\s*<lastmod>2025-03-10<\/lastmod>/)
})

test('RSS feed is generated and advertised', async () => {
  const rss = await readFile(path.join(distDir, 'rss.xml'), 'utf8')

  assert.equal((rss.match(/<item>/g) || []).length, 4)
  assert.match(rss, /<atom:link href="https:\/\/yinming\.me\/rss\.xml" rel="self" type="application\/rss\+xml"\/>/)
  assert.match(rss, /<description><!\[CDATA\[从需求发现、用户共创和创作者变化出发/)
})

test('production JavaScript excludes the development Markdown router', async () => {
  const assetsDir = path.join(distDir, 'assets')
  const javascriptFiles = (await readdir(assetsDir))
    .filter(file => file.endsWith('.js'))
  const sizes = await Promise.all(javascriptFiles.map(async file => {
    const info = await stat(path.join(assetsDir, file))
    return info.size
  }))

  assert.equal(javascriptFiles.length, 1)
  assert.ok(sizes[0] < 30_000, `production JavaScript is ${sizes[0]} bytes`)
})
