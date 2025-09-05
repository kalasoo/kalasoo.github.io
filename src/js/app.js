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
        <small style="color: #666; font-size: 0.8em;">Loaded at: ${new Date().toLocaleTimeString()}</small>
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
    .slice(0, 5)

  contentDiv.innerHTML = `
    <div class="home">
      <section class="recent-posts">
        <h2>Recent Posts</h2>
        <ul>
          ${posts.map(({ route, frontmatter }) => `
            <li>
              <a href="${route}">${frontmatter.title}</a>
              <time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>
            </li>
          `).join('')}
        </ul>
        <p><a href="/posts">See all posts...</a></p>
      </section>
    </div>
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
handleRoute()

// HMR support - this will automatically reload when content changes!
if (import.meta.hot) {
  console.log('🔥 HMR enabled - content changes will auto-reload!')
  import.meta.hot.accept('../content/index.js', () => {
    console.log('📝 Content updated, reloading...')
    handleRoute()
  })
}