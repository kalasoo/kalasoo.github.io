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

const siteConfig = {
  title: '@kalasoo',
  description: 'kalasoo\'s blog',
  baseURL: 'https://yinming.me',
  languageCode: 'zh-cn',
}

const getTemplate = (content, title = siteConfig.title, assetPaths) => `<!DOCTYPE html>
<html lang="${siteConfig.languageCode}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${siteConfig.description}">
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
    const html = getTemplate(content, page.frontmatter.title, assetPaths)
    const outputPath = path.join(distDir, `${page.filename}.html`)

    fs.writeFileSync(outputPath, html, 'utf-8')
    console.log(`   → ${outputPath}`)
  }

  console.log('📝 Building posts...')
  for (const post of posts) {
    const route = `/posts/${post.filename}`
    post.route = route

    const content = renderContent(post.frontmatter, post.html, true)
    const html = getTemplate(content, post.frontmatter.title, assetPaths)
    const outputPath = path.join(postsDir, `${post.filename}.html`)

    fs.writeFileSync(outputPath, html, 'utf-8')
    console.log(`   → ${outputPath}`)
  }

  console.log('🏠 Building home page...')
  const homeContent = renderHomePage(posts)
  const homeHtml = getTemplate(homeContent, siteConfig.title, assetPaths)
  const homePath = path.join(distDir, 'index.html')
  fs.writeFileSync(homePath, homeHtml, 'utf-8')
  console.log(`   → ${homePath}`)

  console.log('📋 Building posts index page...')
  const postsContent = renderPostsPage(posts)
  const postsHtml = getTemplate(postsContent, 'All Posts', assetPaths)
  const postsIndexPath = path.join(postsDir, 'index.html')
  fs.writeFileSync(postsIndexPath, postsHtml, 'utf-8')
  console.log(`   → ${postsIndexPath}`)

  console.log('✅ Static site generation complete!')
  console.log(`   - Generated ${posts.length} posts`)
  console.log(`   - Generated ${pages.length} pages`)
  console.log(`   - Generated home page and posts index`)
}

buildStatic().catch(err => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
