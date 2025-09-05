import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import { generateRSS } from './rss.js'

// Build script for generating static files
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

async function build() {
  console.log('Building static site...')
  
  // Load all content
  const contentModules = import.meta.glob('/src/content/**/*.md', { query: '?raw', import: 'default' })
  const posts = []
  const pages = new Map()
  
  for (const path in contentModules) {
    const content = await contentModules[path]()
    const { data: frontmatter, content: markdown } = matter(content)
    
    const route = getRouteFromPath(path)
    const html = md.render(markdown)
    
    const item = {
      frontmatter,
      content: markdown,
      html,
      route
    }
    
    if (path.includes('/posts/')) {
      posts.push(item)
    } else {
      pages.set(route, item)
    }
  }
  
  // Sort posts by date
  posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
  
  // Generate RSS feed
  const rssContent = generateRSS(posts)
  writeFileSync('dist/rss.xml', rssContent)
  
  console.log('Build complete!')
  console.log(`Generated ${posts.length} posts and ${pages.size} pages`)
}

function getRouteFromPath(path) {
  const cleanPath = path.replace('/src/content/', '').replace('.md', '')
  const parts = cleanPath.split('/')
  
  if (parts[0] === 'posts') {
    return `/posts/${parts[1]}`
  } else if (parts[0] === 'pages') {
    return `/${parts[1]}`
  }
  
  return `/${cleanPath}`
}

build().catch(console.error)