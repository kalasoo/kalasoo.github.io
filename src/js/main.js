import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import { fallbackContent } from './fallback.js'

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// Content loader
class ContentLoader {
  constructor() {
    this.content = new Map()
    this.loadContent()
  }

  async loadContent() {
    try {
      // Load all markdown files
      const contentModules = import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default' })
      console.log('Found content modules:', Object.keys(contentModules)) // Debug log
      
      for (const path in contentModules) {
        try {
          const content = await contentModules[path]()
          const { data: frontmatter, content: markdown } = matter(content)
          
          // Extract route from file path
          const route = this.getRouteFromPath(path)
          console.log('Processing:', path, '->', route) // Debug log
          
          this.content.set(route, {
            frontmatter,
            content: markdown,
            html: md.render(markdown),
            path
          })
        } catch (error) {
          console.error('Error processing file:', path, error)
        }
      }
      
      console.log('Loaded content:', Array.from(this.content.keys())) // Debug log
      
      // Add fallback content if no content was loaded
      if (this.content.size === 0) {
        console.log('No content loaded, using fallback')
        for (const [route, content] of Object.entries(fallbackContent)) {
          this.content.set(route, content)
        }
      }
      
      this.renderCurrentPage()
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }

  getRouteFromPath(path) {
    // Convert /src/content/posts/example.md -> /posts/example
    // Convert /src/content/pages/about.md -> /about
    const cleanPath = path.replace('/src/content/', '').replace('.md', '')
    const parts = cleanPath.split('/')
    
    if (parts[0] === 'posts') {
      return `/posts/${parts[1]}`
    } else if (parts[0] === 'pages') {
      return `/${parts[1]}`
    }
    
    return `/${cleanPath}`
  }

  getContent(route) {
    return this.content.get(route)
  }

  getAllPosts() {
    const posts = []
    for (const [route, data] of this.content.entries()) {
      if (route.startsWith('/posts/')) {
        posts.push({
          route,
          ...data
        })
      }
    }
    return posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
  }

  renderCurrentPage() {
    const path = window.location.pathname
    console.log('Current path:', path) // Debug log
    
    // Handle different path formats
    let contentPath = path
    if (path.endsWith('.html')) {
      contentPath = path.replace('.html', '')
    }
    
    const content = this.getContent(contentPath)
    console.log('Looking for content at:', contentPath, 'Found:', !!content) // Debug log
    
    if (content) {
      this.renderContent(content)
    } else if (path === '/' || path === '/index.html') {
      this.renderHomePage()
    } else if (path === '/posts.html' || path === '/posts') {
      this.renderPostsPage()
    } else if (path === '/about.html' || path === '/about') {
      // Special case for about page
      const aboutContent = this.getContent('/about')
      if (aboutContent) {
        this.renderContent(aboutContent)
      } else {
        this.render404()
      }
    } else {
      this.render404()
    }
  }

  renderContent(content) {
    const contentDiv = document.getElementById('content')
    if (!contentDiv) return

    const html = `
      <article class="post">
        <header>
          <h1>${content.frontmatter.title || 'Untitled'}</h1>
          ${content.frontmatter.date ? `<time>${new Date(content.frontmatter.date).toLocaleDateString('zh-CN')}</time>` : ''}
        </header>
        <div class="content">
          ${content.html}
        </div>
      </article>
    `
    
    contentDiv.innerHTML = html
  }

  renderHomePage() {
    const contentDiv = document.getElementById('content')
    if (!contentDiv) return

    const posts = this.getAllPosts().slice(0, 5)
    
    const html = `
      <div class="home">
        <p>Welcome to my personal blog. Here are my latest thoughts on technology, humanity, and the future.</p>
        <section class="recent-posts">
          <h2>Recent Posts</h2>
          <ul>
            ${posts.map(post => `
              <li>
                <a href="${post.route}">${post.frontmatter.title}</a>
                <time>${new Date(post.frontmatter.date).toLocaleDateString('zh-CN')}</time>
              </li>
            `).join('')}
          </ul>
          <p><a href="/posts.html">See all posts...</a></p>
        </section>
      </div>
    `
    
    contentDiv.innerHTML = html
  }

  renderPostsPage() {
    const contentDiv = document.getElementById('content')
    if (!contentDiv) return

    const posts = this.getAllPosts()
    
    const html = `
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
    
    contentDiv.innerHTML = html
  }

  render404() {
    const contentDiv = document.getElementById('content')
    if (!contentDiv) return

    contentDiv.innerHTML = `
      <div class="error">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">Go back home</a></p>
      </div>
    `
  }
}

// Initialize the content loader
const contentLoader = new ContentLoader()

// Handle navigation
window.addEventListener('popstate', () => {
  contentLoader.renderCurrentPage()
})

// Handle clicks on internal links
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && e.target.hostname === window.location.hostname) {
    e.preventDefault()
    const path = new URL(e.target.href).pathname
    window.history.pushState({}, '', path)
    contentLoader.renderCurrentPage()
  }
})