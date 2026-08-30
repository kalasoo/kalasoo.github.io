import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import toml from 'toml'
import { content } from '../content/index.js'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

function parseContent(markdownContent) {
  return matter(markdownContent, {
    engines: {
      toml
    },
    language: 'toml',
    delimiters: '+++'
  })
}

function renderDate(value) {
  const date = new Date(value)
  return `<time datetime="${date.toISOString()}">${date.toLocaleDateString('zh-CN')}</time>`
}

function publishedEntries(prefix) {
  return Object.entries(content)
    .filter(([route]) => route.startsWith(prefix))
    .map(([route, markdownContent]) => {
      const { data: frontmatter } = parseContent(markdownContent)
      return { route, frontmatter }
    })
    .filter(({ frontmatter }) => frontmatter.draft !== true)
}

function renderContent(route) {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const markdownContent = content[route]
  if (!markdownContent) {
    contentDiv.innerHTML = '<h1>404 - Page Not Found</h1>'
    return
  }

  const { data: frontmatter, content: markdown } = parseContent(markdownContent)
  if (frontmatter.draft === true) {
    contentDiv.innerHTML = '<h1>404 - Page Not Found</h1>'
    return
  }

  contentDiv.innerHTML = `
    <article class="post">
      <div class="post-header">
        <h1>${frontmatter.title || 'Untitled'}</h1>
        ${frontmatter.date ? renderDate(frontmatter.date) : ''}
      </div>
      <div class="content">
        ${md.render(markdown)}
      </div>
    </article>
  `
}

function renderHomePage() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const posts = publishedEntries('/posts/')
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
    .slice(0, 10)

  contentDiv.innerHTML = `
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
        ${posts.map(({ route, frontmatter }) => `
          <li class="post-item">
            <a href="${route}">
              <h2>${frontmatter.title}</h2>
              ${renderDate(frontmatter.date)}
            </a>
          </li>
        `).join('')}
      </ul>
      <p><a href="/posts">See all posts →</a></p>
    </section>
  `
}

function renderPostsPage() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const posts = publishedEntries('/posts/')
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))

  contentDiv.innerHTML = `
    <div class="posts">
      <h1>All Posts</h1>
      <ul class="post-list">
        ${posts.map(({ route, frontmatter }) => `
          <li class="post-item">
            <a href="${route}">
              <h2>${frontmatter.title}</h2>
              ${renderDate(frontmatter.date)}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `
}

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

window.addEventListener('popstate', handleRoute)
document.addEventListener('click', event => {
  const link = event.target.closest('a')
  if (!link
    || link.origin !== window.location.origin
    || link.target
    || link.download
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey) {
    return
  }

  event.preventDefault()
  window.history.pushState({}, '', link.href)
  handleRoute()
})

handleRoute()

if (import.meta.hot) {
  import.meta.hot.accept('../content/index.js', handleRoute)
}
