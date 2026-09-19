import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import toml from 'toml'
import MarkdownIt from 'markdown-it'
import { siteConfig } from './src/js/config.js'
import { generateRSS } from './src/js/rss.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// Tables render inside a scroll container so wide data stays readable on phones.
md.renderer.rules.table_open = () => '<div class="table-wrap">\n<table>\n'
md.renderer.rules.table_close = () => '</table>\n</div>\n'

function extractDescription(html, maxLength = 160) {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function serializeJsonLd(value) {
  return JSON.stringify(value, null, 2).replaceAll('<', '\\u003c')
}

function toIsoDate(value) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`)
  }

  return date.toISOString()
}

function toSitemapDate(value) {
  return value ? toIsoDate(value).split('T')[0] : null
}

function renderDate(value) {
  const date = new Date(value)
  return `<time datetime="${toIsoDate(value)}">${date.toLocaleDateString('zh-CN')}</time>`
}

function generateSitemap(posts, pages) {
  const latestPostDate = posts
    .map(post => post.frontmatter.modified || post.frontmatter.date)
    .filter(Boolean)
    .map(toSitemapDate)
    .sort()
    .at(-1)

  const urls = [
    { loc: siteConfig.baseURL },
    { loc: `${siteConfig.baseURL}/posts`, lastmod: latestPostDate }
  ]

  for (const page of pages) {
    urls.push({
      loc: `${siteConfig.baseURL}/${page.filename}`,
      lastmod: toSitemapDate(page.frontmatter.modified || page.frontmatter.date)
    })
  }

  for (const post of posts) {
    urls.push({
      loc: `${siteConfig.baseURL}/posts/${post.filename}`,
      lastmod: toSitemapDate(post.frontmatter.modified || post.frontmatter.date)
    })
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(({ loc, lastmod }) => `  <url>
    <loc>${escapeHtml(loc)}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${siteConfig.baseURL}/sitemap.xml`
}


const getTemplate = (content, title = siteConfig.title, assetPaths, meta = {}) => {
  const pageTitle = meta.seoTitle
    || (title === siteConfig.title ? siteConfig.seoTitle : title)
  const description = meta.description || siteConfig.description
  const url = meta.url || siteConfig.baseURL
  const type = meta.type || 'website'
  const image = meta.image || `${siteConfig.baseURL}/icon.png`
  const datePublished = toIsoDate(meta.date)
  const dateModified = toIsoDate(meta.modified) || datePublished
  const author = {
    '@type': 'Person',
    '@id': `${siteConfig.baseURL}/about#person`,
    name: siteConfig.author.name,
    url: `${siteConfig.baseURL}/about`,
    sameAs: [
      siteConfig.author.github,
      siteConfig.author.x,
      siteConfig.author.telegram
    ].filter(Boolean)
  }
  const websiteReference = {
    '@type': 'WebSite',
    '@id': `${siteConfig.baseURL}/#website`,
    url: siteConfig.baseURL,
    name: siteConfig.title
  }

  let structuredData
  if (meta.type === 'article') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      url,
      image: meta.image || undefined,
      datePublished,
      dateModified,
      inLanguage: siteConfig.languageCode,
      author,
      publisher: author,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url
      },
      isPartOf: websiteReference
    }
  } else if (meta.schemaType === 'profile') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': `${url}#profile`,
      url,
      name: title,
      description,
      inLanguage: siteConfig.languageCode,
      mainEntity: author,
      isPartOf: websiteReference
    }
  } else if (meta.schemaType === 'collection') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${url}#collection`,
      url,
      name: title,
      description,
      inLanguage: siteConfig.languageCode,
      isPartOf: websiteReference
    }
  } else if (url === siteConfig.baseURL) {
    structuredData = {
      '@context': 'https://schema.org',
      ...websiteReference,
      description: siteConfig.description,
      inLanguage: siteConfig.languageCode,
      author
    }
  } else {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: siteConfig.languageCode,
      isPartOf: websiteReference
    }
  }

  const isHomePage = url === siteConfig.baseURL
  const siteTitle = `<a href="/">${escapeHtml(siteConfig.title)}</a>`
  // Same wordmark top-left on every page; the home page just carries the h1.
  const brand = isHomePage
    ? `<h1 class="site-title">${siteTitle}</h1>`
    : `<div class="site-title">${siteTitle}</div>`
  const navLink = item => {
    const current = meta.nav === item.url.replace('/', '')
    return `<a href="${item.url}"${current ? ' aria-current="page"' : ''}>${item.title}</a>`
  }

  return `<!DOCTYPE html>
<html lang="${escapeHtml(siteConfig.languageCode)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="${escapeHtml(siteConfig.author.name)}">
  <link rel="canonical" href="${escapeHtml(url)}">

  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${escapeHtml(type)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:site_name" content="${escapeHtml(siteConfig.title)}">
  <meta property="og:locale" content="zh_CN">
  ${datePublished ? `<meta property="article:published_time" content="${datePublished}">` : ''}
  ${dateModified ? `<meta property="article:modified_time" content="${dateModified}">` : ''}

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:site" content="@kalasoo">
  <meta name="twitter:creator" content="@kalasoo">

  <script type="application/ld+json">
${serializeJsonLd(structuredData)}
  </script>

  <meta name="theme-color" content="#f2f2f2" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
  <script>
    // Paint the stored theme before first paint to avoid a light flash.
    try {
      const stored = localStorage.getItem('theme-preference')
      if (stored && stored !== 'auto') document.documentElement.dataset.theme = stored
    } catch {}
  </script>

  <link rel="icon" type="image/png" href="/icon.png">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(siteConfig.title)} RSS" href="/rss.xml">
  <link rel="stylesheet" href="${escapeHtml(assetPaths.cssPath)}">
</head>
<body class="${escapeHtml(['page', meta.pageClass].filter(Boolean).join(' '))}">
  <div class="shell">
    <header class="site-header">
      <div class="site-header__bar">
        ${brand}
        <div class="site-header__actions">
          <nav class="site-nav" aria-label="Main">
            <ul>
              ${siteConfig.menu.map(item => `<li>${navLink(item)}</li>`).join('\n              ')}
            </ul>
          </nav>
          <div class="theme-toggle" role="group" aria-label="Theme">
            <button type="button" data-theme-btn="light" title="Light mode" aria-label="Light mode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4.1" />
                <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
              </svg>
            </button>
            <button type="button" data-theme-btn="auto" title="Auto (system)" aria-label="Auto theme" class="active">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" stroke-width="1.7" />
                <path d="M12 4.4a7.6 7.6 0 0 1 0 15.2z" fill="currentColor" />
              </svg>
            </button>
            <button type="button" data-theme-btn="dark" title="Dark mode" aria-label="Dark mode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main>
      <div id="content">
        ${content}
      </div>
    </main>
  </div>

  <script type="module" src="${escapeHtml(assetPaths.jsPath)}"></script>
</body>
</html>`
}

function renderContent(frontmatter, html, options = {}) {
  const footer = options.footer

  return `
    <article class="entry">
      <header class="post__head">
        ${frontmatter.date ? `<p class="post__meta">${renderDate(frontmatter.date)}</p>` : ''}
        <h1>${escapeHtml(frontmatter.title || 'Untitled')}</h1>
      </header>
      <div class="post">
        <div class="content">
          ${html}
        </div>
        ${footer ? `<footer class="post__foot"><a class="chip" href="${footer.href}">${footer.label}</a></footer>` : ''}
      </div>
    </article>
  `
}

// Home grid: the newest post gets the large tile, the fifth a wide one, which
// fills the three-column bento exactly for both five and ten posts.
function postCard(post, index) {
  const variant = index === 0 ? ' post-card--feature' : (index === 4 ? ' post-card--wide' : '')

  return `
          <li class="post-card${variant}">
            <a href="${escapeHtml(post.route)}">
              ${renderDate(post.frontmatter.date)}
              <h2 class="post-card__title">${escapeHtml(post.frontmatter.title)}</h2>
              <p class="post-card__desc">${escapeHtml(post.frontmatter.description || extractDescription(post.html, index === 0 ? 180 : 120))}</p>
            </a>
          </li>`
}

function renderHomePage(posts) {
  const recentPosts = posts.slice(0, 10)

  return `
    <article class="hero">
      <div class="hero__profile">
        <div class="hero__aside">
          <img src="/icon.png" alt="Yin Ming" class="hero__avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="icon-placeholder" style="display: none;">👨‍💻</div>
        </div>
        <div class="hero__body">
          <blockquote class="hero__quote">
            <p>We can only see a short distance ahead, but we can see plenty there that needs to be done.</p>
            <cite>Alan Turing</cite>
          </blockquote>
          <p class="hero__lead">我叫<strong>阴明</strong>，我的工作致力于寻找人类与科技健康共存的方法，存续人类文明。</p>
          <p class="hero__lead hero__lead--en">My name is <strong>Yin Ming</strong>, and my work is dedicated to discovering ways for humanity and technology to coexist in harmony, thereby preserving human civilization.</p>
          <div class="hero__contact">
            <p class="hero__note">You can find me on</p>
            <ul class="chips">
              <li><a class="chip" href="https://t.me/kalasoo">Telegram</a></li>
              <li><a class="chip" href="https://x.com/kalasoo">X</a></li>
              <li><a class="chip" href="https://github.com/kalasoo">GitHub</a></li>
              <li><a class="chip" href="/about">About me</a></li>
            </ul>
          </div>
        </div>
      </div>
    </article>

    <section class="section">
      <div class="section__head">
        <h2 class="section__label">Recent Posts</h2>
        <a class="section__link" href="/posts">All posts →</a>
      </div>
      <ul class="bento">
        ${recentPosts.map(postCard).join('')}
      </ul>
    </section>
  `
}

function renderPostsPage(posts) {
  return `
    <div class="page-head">
      <h1>All Posts</h1>
    </div>
    <ul class="post-rows">
      ${posts.map(post => `
        <li class="post-row">
          <a href="${escapeHtml(post.route)}">
            <div>
              <h2 class="post-row__title">${escapeHtml(post.frontmatter.title)}</h2>
              <p class="post-row__desc">${escapeHtml(post.frontmatter.description || extractDescription(post.html, 120))}</p>
            </div>
            ${renderDate(post.frontmatter.date)}
          </a>
        </li>`).join('')}
    </ul>
  `
}

function readMarkdownFiles(dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const filePath = path.join(dir, entry.name)
      const content = fs.readFileSync(filePath, 'utf-8')
      const { data: frontmatter, content: markdown } = matter(content, {
        engines: {
          toml: toml
        },
        language: 'toml',
        delimiters: '+++'
      })

      if (frontmatter.draft === true) {
        continue
      }

      files.push({
        filename: entry.name.replace('.md', ''),
        frontmatter,
        markdown,
        html: md.render(markdown)
      })
    }
  }

  return files
}

function getAssetPaths() {
  const viteIndexPath = path.join(process.cwd(), 'dist/index.html')
  const viteHtml = fs.readFileSync(viteIndexPath, 'utf-8')

  const cssMatch = viteHtml.match(/href="\/assets\/([^"]+\.css)"/)
  const jsMatch = viteHtml.match(/src="\/assets\/([^"]+\.js)"/)

  return {
    cssPath: cssMatch ? `/assets/${cssMatch[1]}` : '/assets/main.css',
    jsPath: jsMatch ? `/assets/${jsMatch[1]}` : '/assets/app.js'
  }
}

async function buildStatic() {
  console.log('🚀 Starting static site generation...')

  const distDir = path.join(process.cwd(), 'dist')
  const postsDir = path.join(distDir, 'posts')

  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true })
  }

  const cnamePath = path.join(process.cwd(), 'CNAME')
  if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(distDir, 'CNAME'))
    console.log('📋 Copied CNAME file')
  }

  const assetPaths = getAssetPaths()
  console.log(`📦 Found assets: ${assetPaths.cssPath}, ${assetPaths.jsPath}`)

  const posts = readMarkdownFiles(path.join(__dirname, 'src/content/posts'))
  const pages = readMarkdownFiles(path.join(__dirname, 'src/content/pages'))

  console.log(`📄 Found ${posts.length} posts and ${pages.length} pages`)

  posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))

  console.log('📝 Building pages...')
  for (const page of pages) {
    const content = renderContent(page.frontmatter, page.html)
    const meta = {
      description: page.frontmatter.description || extractDescription(page.html),
      url: `${siteConfig.baseURL}/${page.filename}`,
      type: 'website',
      schemaType: page.filename === 'about' ? 'profile' : 'webpage',
      pageClass: 'page--article',
      nav: page.filename === 'about' ? 'about' : undefined
    }
    const html = getTemplate(content, page.frontmatter.title, assetPaths, meta)
    const outputPath = path.join(distDir, `${page.filename}.html`)

    fs.writeFileSync(outputPath, html, 'utf-8')
    console.log(`   → ${outputPath}`)
  }

  console.log('📝 Building posts...')
  for (const post of posts) {
    const route = `/posts/${post.filename}`
    post.route = route

    const content = renderContent(post.frontmatter, post.html, {
      footer: { href: '/posts', label: 'All posts' }
    })
    const meta = {
      description: post.frontmatter.description || extractDescription(post.html),
      url: `${siteConfig.baseURL}/posts/${post.filename}`,
      type: 'article',
      pageClass: 'page--article',
      nav: 'posts',
      image: post.frontmatter.image
        ? new URL(post.frontmatter.image, siteConfig.baseURL).href
        : undefined,
      date: post.frontmatter.date,
      modified: post.frontmatter.modified
    }
    const html = getTemplate(content, post.frontmatter.title, assetPaths, meta)
    const outputPath = path.join(postsDir, `${post.filename}.html`)

    fs.writeFileSync(outputPath, html, 'utf-8')
    console.log(`   → ${outputPath}`)
  }

  console.log('🏠 Building home page...')
  const homeContent = renderHomePage(posts)
  const homeMeta = {
    description: siteConfig.description,
    url: siteConfig.baseURL,
    type: 'website',
    pageClass: 'page--home'
  }
  const homeHtml = getTemplate(homeContent, siteConfig.title, assetPaths, homeMeta)
  const homePath = path.join(distDir, 'index.html')
  fs.writeFileSync(homePath, homeHtml, 'utf-8')
  console.log(`   → ${homePath}`)

  console.log('📋 Building posts index page...')
  const postsContent = renderPostsPage(posts)
  const postsIndexMeta = {
    description: '阴明关于 AI、产品、内容平台、科技与社会的全部文章。',
    url: `${siteConfig.baseURL}/posts`,
    type: 'website',
    schemaType: 'collection',
    pageClass: 'page--list',
    nav: 'posts'
  }
  const postsHtml = getTemplate(postsContent, 'All Posts', assetPaths, postsIndexMeta)
  const postsIndexPath = path.join(postsDir, 'index.html')
  fs.writeFileSync(postsIndexPath, postsHtml, 'utf-8')
  console.log(`   → ${postsIndexPath}`)

  console.log('🗺️ Generating sitemap.xml...')
  const sitemap = generateSitemap(posts, pages)
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf-8')
  console.log(`   → ${path.join(distDir, 'sitemap.xml')}`)

  console.log('🤖 Generating robots.txt...')
  const robotsTxt = generateRobotsTxt()
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8')
  console.log(`   → ${path.join(distDir, 'robots.txt')}`)

  console.log('📡 Generating rss.xml...')
  const rss = generateRSS(posts)
  fs.writeFileSync(path.join(distDir, 'rss.xml'), rss, 'utf-8')
  console.log(`   → ${path.join(distDir, 'rss.xml')}`)

  console.log('✅ Static site generation complete!')
  console.log(`   - Generated ${posts.length} posts`)
  console.log(`   - Generated ${pages.length} pages`)
  console.log(`   - Generated home page and posts index`)
  console.log(`   - Generated sitemap.xml, robots.txt, and rss.xml`)
}

buildStatic().catch(err => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
