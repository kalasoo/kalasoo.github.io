import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import toml from 'toml'
import MarkdownIt from 'markdown-it'

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

function generateSitemap(posts, pages) {
  const urls = [
    { loc: siteConfig.baseURL, priority: '1.0', changefreq: 'weekly' },
    { loc: `${siteConfig.baseURL}/posts`, priority: '0.8', changefreq: 'weekly' }
  ]

  for (const page of pages) {
    urls.push({
      loc: `${siteConfig.baseURL}/${page.filename}`,
      priority: '0.7',
      changefreq: 'monthly'
    })
  }

  for (const post of posts) {
    urls.push({
      loc: `${siteConfig.baseURL}/posts/${post.filename}`,
      lastmod: post.frontmatter.date ? new Date(post.frontmatter.date).toISOString().split('T')[0] : null,
      priority: '0.6',
      changefreq: 'monthly'
    })
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return sitemap
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${siteConfig.baseURL}/sitemap.xml`
}

const siteConfig = {
  title: '@kalasoo',
  description: 'kalasoo\'s blog',
  baseURL: 'https://yinming.me',
  languageCode: 'zh-cn',
}

const getTemplate = (content, title = siteConfig.title, assetPaths, meta = {}) => {
  const pageTitle = title === siteConfig.title ? title : `${title} | ${siteConfig.title}`
  const description = meta.description || siteConfig.description
  const url = meta.url || siteConfig.baseURL
  const type = meta.type || 'website'
  const image = meta.image || `${siteConfig.baseURL}/icon.png`
  const datePublished = meta.date ? new Date(meta.date).toISOString() : null
  const dateModified = meta.modified ? new Date(meta.modified).toISOString() : datePublished

  // JSON-LD structured data
  let jsonLd = ''
  if (meta.type === 'article') {
    jsonLd = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${title}",
      "description": "${description}",
      "url": "${url}",
      "image": "${image}",
      "datePublished": "${datePublished}",
      "dateModified": "${dateModified || datePublished}",
      "author": {
        "@type": "Person",
        "name": "Yin Ming",
        "url": "${siteConfig.baseURL}/about"
      },
      "publisher": {
        "@type": "Person",
        "name": "Yin Ming"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${url}"
      }
    }
    </script>`
  } else {
    jsonLd = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "${siteConfig.title}",
      "description": "${siteConfig.description}",
      "url": "${siteConfig.baseURL}",
      "author": {
        "@type": "Person",
        "name": "Yin Ming",
        "url": "${siteConfig.baseURL}/about"
      }
    }
    </script>`
  }

  return `<!DOCTYPE html>
<html lang="${siteConfig.languageCode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${url}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="${siteConfig.title}">
  <meta property="og:locale" content="zh_CN">
  ${datePublished ? `<meta property="article:published_time" content="${datePublished}">` : ''}
  ${dateModified ? `<meta property="article:modified_time" content="${dateModified}">` : ''}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:site" content="@kalasoo">
  <meta name="twitter:creator" content="@kalasoo">
  
  <!-- JSON-LD Structured Data -->
  ${jsonLd}
  
  <link rel="shortcut icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="${assetPaths.cssPath}">
</head>
<body>
  <div class="container">
    <header>
      <h1><a href="/">@kalasoo</a></h1>
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

  <script type="module" src="${assetPaths.jsPath}"></script>
</body>
</html>`
}

function renderContent(frontmatter, html, isPost = false) {
  if (!isPost) {
    return `
      <article class="post">
        <div class="post-header">
          <h1>${frontmatter.title || 'Untitled'}</h1>
          ${frontmatter.date ? `<time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>` : ''}
        </div>
        <div class="content">
          ${html}
        </div>
      </article>
    `
  }

  return `
    <article class="post">
      <div class="post-header">
        <h1>${frontmatter.title || 'Untitled'}</h1>
        ${frontmatter.date ? `<time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>` : ''}
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
            <a href="${post.route}">
              <h2>${post.frontmatter.title}</h2>
              <time>${new Date(post.frontmatter.date).toLocaleDateString('zh-CN')}</time>
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
            <a href="${post.route}">
              <h2>${post.frontmatter.title}</h2>
              <time>${new Date(post.frontmatter.date).toLocaleDateString('zh-CN')}</time>
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
    const route = `/${page.filename}`
    const content = renderContent(page.frontmatter, page.html, false)
    const meta = {
      description: page.frontmatter.description || extractDescription(page.html),
      url: `${siteConfig.baseURL}/${page.filename}`,
      type: 'website'
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

    const content = renderContent(post.frontmatter, post.html, true)
    const meta = {
      description: post.frontmatter.description || extractDescription(post.html),
      url: `${siteConfig.baseURL}/posts/${post.filename}`,
      type: 'article',
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
    description: 'All blog posts by Yin Ming',
    url: `${siteConfig.baseURL}/posts`,
    type: 'website'
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

  console.log('✅ Static site generation complete!')
  console.log(`   - Generated ${posts.length} posts`)
  console.log(`   - Generated ${pages.length} pages`)
  console.log(`   - Generated home page and posts index`)
  console.log(`   - Generated sitemap.xml and robots.txt`)
}

buildStatic().catch(err => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
