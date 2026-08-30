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
  const brand = isHomePage
    ? `<h1 class="site-title">${siteTitle}</h1>`
    : `<div class="site-title">${siteTitle}</div>`

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

  <link rel="icon" type="image/png" href="/icon.png">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(siteConfig.title)} RSS" href="/rss.xml">
  <link rel="stylesheet" href="${escapeHtml(assetPaths.cssPath)}">
</head>
<body>
  <div class="container">
    <header>
      ${brand}
      <nav>
        <ul>
          <li><a href="/about">about</a></li>
          <li><a href="/posts">all posts</a></li>
          <li>
            <div class="theme-toggle">
              <button data-theme-btn="light" title="Light mode">☀️</button>
              <button data-theme-btn="auto" title="Auto (system)" class="active">A</button>
              <button data-theme-btn="dark" title="Dark mode">🌙</button>
            </div>
          </li>
        </ul>
      </nav>
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

function renderContent(frontmatter, html) {
  return `
    <article class="post">
      <div class="post-header">
        <h1>${escapeHtml(frontmatter.title || 'Untitled')}</h1>
        ${frontmatter.date ? renderDate(frontmatter.date) : ''}
      </div>
      <div class="content">
        ${html}
      </div>
    </article>
  `
}

function renderHomePage(posts) {
  const recentPosts = posts.slice(0, 10)

  return `
    <article class="home-intro">
      <div class="intro-content">
        <div class="intro-icon">
          <img src="/icon.png" alt="Yin Ming" class="profile-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="icon-placeholder" style="display: none;">👨‍💻</div>
        </div>
        <div class="intro-text">
          <blockquote>
            We can only see a short distance ahead, but we can see plenty there that needs to be done. - Alan Turing
          </blockquote>

          <p>我叫<strong>阴明</strong>，我的工作致力于寻找人类与科技健康共存的方法，存续人类文明。
          <br/>
          My name is <strong>Yin Ming</strong>, and my work is dedicated to discovering ways for humanity and technology to coexist in harmony, thereby preserving human civilization.</p>

          <p>You can find me on <a href="https://t.me/kalasoo">Telegram</a>, <a href="https://x.com/kalasoo">X</a>, <a href="https://github.com/kalasoo">GitHub</a> or learn more <a href="/about">about me</a></p>
        </div>
      </div>
    </article>

    <section class="recent-posts-section">
      <h2>Recent Posts</h2>
      <ul class="post-list">
        ${recentPosts.map(post => `
          <li class="post-item">
            <a href="${escapeHtml(post.route)}">
              <h2>${escapeHtml(post.frontmatter.title)}</h2>
              ${renderDate(post.frontmatter.date)}
            </a>
          </li>
        `).join('')}
      </ul>
      <p><a href="/posts">See all posts →</a></p>
    </section>
  `
}

function renderPostsPage(posts) {
  return `
    <div class="posts">
      <h1>All Posts</h1>
      <ul class="post-list">
        ${posts.map(post => `
          <li class="post-item">
            <a href="${escapeHtml(post.route)}">
              <h2>${escapeHtml(post.frontmatter.title)}</h2>
              ${renderDate(post.frontmatter.date)}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
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
      schemaType: page.filename === 'about' ? 'profile' : 'webpage'
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

    const content = renderContent(post.frontmatter, post.html)
    const meta = {
      description: post.frontmatter.description || extractDescription(post.html),
      url: `${siteConfig.baseURL}/posts/${post.filename}`,
      type: 'article',
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
    type: 'website'
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
    schemaType: 'collection'
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
