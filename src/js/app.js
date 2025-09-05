// Simple, clean app - let Vite handle HMR
console.log('🚀 App.js loading...')

import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import toml from 'toml'

console.log('📦 Dependencies loaded, importing content...')

import { content } from '../content/index.js'

console.log('✅ Content imported:', Object.keys(content))

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// Simple content renderer
function renderContent(route) {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const markdownContent = content[route]
  if (!markdownContent) {
    contentDiv.innerHTML = '<h1>404 - Page Not Found</h1>'
    return
  }

  // Parse frontmatter and markdown
  const { data: frontmatter, content: markdown } = matter(markdownContent, {
    engines: {
      toml: toml
    },
    language: 'toml',
    delimiters: '+++'
  })
  const html = md.render(markdown)

  // Render the page
  contentDiv.innerHTML = `
    <article class="post">
      <header>
        <h1>${frontmatter.title || 'Untitled'}</h1>
        ${frontmatter.date ? `<time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>` : ''}
      </header>
      <div class="content">
        ${html}
      </div>
    </article>
  `
}

// Simple router
function handleRoute() {
  const path = window.location.pathname
  
  if (path === '/') {
    renderHomePage()
  } else if (path === '/posts') {
    renderPostsPage()
  } else {
    renderContent(path)
  }
}

// Home page
function renderHomePage() {
  const contentDiv = document.getElementById('content')
  const posts = Object.entries(content)
    .filter(([route]) => route.startsWith('/posts/'))
    .map(([route, markdownContent]) => {
      const { data: frontmatter } = matter(markdownContent, {
        engines: {
          toml: toml
        },
        language: 'toml',
        delimiters: '+++'
      })
      return { route, frontmatter }
    })
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
    .slice(0, 10)

  contentDiv.innerHTML = `
    <article class="home-intro">
      <div class="intro-content">
        <div class="intro-icon">
          <img src="/public/icon.png" alt="Yin Ming" class="profile-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
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
        ${posts.map(({ route, frontmatter }) => `
          <li class="post-item">
            <a href="${route}">
              <h2>${frontmatter.title}</h2>
              <time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>
            </a>
          </li>
        `).join('')}
      </ul>
      <p><a href="/posts">See all posts →</a></p>
    </section>
  `
}

// Posts page
function renderPostsPage() {
  const contentDiv = document.getElementById('content')
  
  const posts = Object.entries(content)
    .filter(([route]) => route.startsWith('/posts/'))
    .map(([route, markdownContent]) => {
      const { data: frontmatter } = matter(markdownContent, {
        engines: {
          toml: toml
        },
        language: 'toml',
        delimiters: '+++'
      })
      return { route, frontmatter }
    })
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))

  contentDiv.innerHTML = `
    <div class="posts">
      <h1>All Posts</h1>
      <ul class="post-list">
        ${posts.map(({ route, frontmatter }) => `
          <li class="post-item">
            <a href="${route}">
              <h2>${frontmatter.title}</h2>
              <time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `
}

// Handle navigation
window.addEventListener('popstate', handleRoute)
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.hostname === window.location.hostname) {
    e.preventDefault()
    const path = new URL(e.target.href).pathname
    window.history.pushState({}, '', path)
    handleRoute()
  }
})

// Initial load
// Check if we came from a 404 redirect
const redirectPath = sessionStorage.getItem('redirect')
if (redirectPath && redirectPath !== window.location.pathname) {
  sessionStorage.removeItem('redirect')
  window.history.replaceState({}, '', redirectPath)
  handleRoute()
} else {
  handleRoute()
}

// HMR support - this will automatically reload when content changes!
if (import.meta.hot) {
  console.log('🔥 HMR enabled - content changes will auto-reload!')
  import.meta.hot.accept('../content/index.js', () => {
    console.log('📝 Content updated, reloading...')
    handleRoute()
  })
}