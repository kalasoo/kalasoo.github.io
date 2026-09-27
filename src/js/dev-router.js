import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import toml from 'toml'
import { siteConfig } from './config.js'
import { content } from '../content/index.js'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// Tables render inside a scroll container so wide data stays readable on phones.
md.renderer.rules.table_open = () => '<div class="table-wrap">\n<table>\n'
md.renderer.rules.table_close = () => '</table>\n</div>\n'

function parseContent(markdownContent) {
  return matter(markdownContent, {
    engines: {
      toml
    },
    language: 'toml',
    delimiters: '+++'
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderDate(value) {
  const date = new Date(value)
  return `<time datetime="${date.toISOString()}">${date.toLocaleDateString('zh-CN')}</time>`
}

function excerpt(markdown, maxLength) {
  const text = markdown
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>[\]()~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`
}

function publishedEntries(prefix) {
  return Object.entries(content)
    .filter(([route]) => route.startsWith(prefix))
    .map(([route, markdownContent]) => {
      const { data: frontmatter, content: markdown } = parseContent(markdownContent)
      return { route, frontmatter, markdown }
    })
    .filter(({ frontmatter }) => frontmatter.draft !== true)
}

// Keep the dev shell in step with the static template: page class for layout,
// the wordmark in the bar, aria-current on the active nav item.
function syncShell(path, pageClass) {
  document.body.className = `page ${pageClass}`

  const bar = document.querySelector('.site-header__bar')
  if (bar) {
    const wantTag = path === '/' ? 'H1' : 'DIV'
    const current = bar.querySelector('.site-title')
    if (!current || current.tagName !== wantTag) {
      current?.remove()
      const node = document.createElement(wantTag.toLowerCase())
      node.className = 'site-title'
      node.innerHTML = `<a href="/">${escapeHtml(siteConfig.title)}</a>`
      bar.prepend(node)
    }
  }

  const navKey = path === '/about'
    ? 'about'
    : (path === '/posts' || path.startsWith('/posts/') ? 'posts' : null)

  document.querySelectorAll('.site-nav a').forEach(link => {
    if (navKey && link.getAttribute('href') === `/${navKey}`) {
      link.setAttribute('aria-current', 'page')
    } else {
      link.removeAttribute('aria-current')
    }
  })
}

function renderContent(route) {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const markdownContent = content[route]
  const { data: frontmatter = {}, content: markdown = '' } = markdownContent
    ? parseContent(markdownContent)
    : {}

  if (!markdownContent || frontmatter.draft === true) {
    contentDiv.innerHTML = `
      <div class="notfound">
        <h1>404</h1>
        <p>这个页面不存在。<br>This page does not exist.</p>
        <a class="chip" href="/">Back home</a>
      </div>
    `
    return
  }

  contentDiv.innerHTML = `
    <article class="entry">
      <header class="post__head">
        ${frontmatter.date ? `<p class="post__meta">${renderDate(frontmatter.date)}</p>` : ''}
        <h1>${escapeHtml(frontmatter.title || 'Untitled')}</h1>
      </header>
      <div class="post">
        <div class="content">
          ${md.render(markdown)}
        </div>
        ${route.startsWith('/posts/')
          ? '<footer class="post__foot"><a class="chip" href="/posts">Posts</a></footer>'
          : ''}
      </div>
    </article>
  `
}

// Home grid: the newest post takes the full-width cover, the rest pair off, and
// a trailing single goes full width so the last row never ends half empty. The
// callback gets the list as its third argument, so the total comes for free.
function postCard(post, index, posts) {
  const variant = index === 0
    ? ' post-card--cover'
    : (index === posts.length - 1 && (posts.length - 1) % 2 === 1
        ? ' post-card--wide'
        : ' post-card--half')
  const { route, frontmatter } = post

  return `
    <li class="post-card${variant}">
      <a href="${route}">
        ${renderDate(frontmatter.date)}
        <h3 class="post-card__title">${escapeHtml(frontmatter.title)}</h3>
      </a>
    </li>`
}

// Hero contact row: the word for the page, official line marks for the
// networks. Paths are the brand geometry drawn with strokes, no fills.
const CONTACT_CHIPS = `<ul class="chips">
            <li><a class="chip" href="/about">About</a></li>
            <li>
              <a class="chip chip--icon" href="https://x.com/kalasoo" title="X" aria-label="X">
                <svg viewBox="0.05 0.01 23.97 23.97" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" />
                </svg>
              </a>
            </li>
            <li>
              <a class="chip chip--icon" href="https://t.me/kalasoo" title="Telegram" aria-label="Telegram">
                <svg viewBox="-1.21 -1.21 26.39 26.39" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true">
                  <path d="M23.91 3.79 20.3 20.84c-.25 1.21-.98 1.5-2 .94l-5.5-4.07-2.66 2.57c-.3.3-.55.56-1.1.56-.72 0-.6-.27-.84-.95L6.3 13.7l-5.45-1.7c-1.18-.35-1.19-1.16.26-1.75l21.26-8.2c.97-.43 1.9.24 1.53 1.73z" />
                </svg>
              </a>
            </li>
            <li>
              <a class="chip chip--icon" href="https://github.com/kalasoo" title="GitHub" aria-label="GitHub">
                <svg viewBox="0.04 -0.23 23.43 23.43" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </li>
          </ul>`

function renderHomePage() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const posts = publishedEntries('/posts/')
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
    .slice(0, 10)

  contentDiv.innerHTML = `
    <article class="hero">
      <div class="hero__profile">
        <div class="hero__aside">
          <img src="/icon.png" alt="Yin Ming" class="hero__avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="icon-placeholder" style="display: none;">👨‍💻</div>
        </div>
        <div class="hero__body">
          <p class="hero__lead">我叫<strong>阴明</strong>，我的工作致力于寻找人类与科技健康共存的方法，存续人类文明。</p>
          <p class="hero__lead hero__lead--en">My name is <strong>Yin Ming</strong>, and my work is dedicated to discovering ways for humanity and technology to coexist in harmony, thereby preserving human civilization.</p>
          ${CONTACT_CHIPS}
        </div>
      </div>
    </article>

    <section class="section">
      <div class="section__head">
        <h2 class="section__label">Recent posts</h2>
        <a class="chip" href="/posts">Posts →</a>
      </div>
      <ul class="bento">
        ${posts.map(postCard).join('')}
      </ul>
    </section>
  `
}

function renderPostsPage() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const posts = publishedEntries('/posts/')
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))

  contentDiv.innerHTML = `
    <div class="page-head">
      <h1>Posts</h1>
    </div>
    <ul class="post-rows">
      ${posts.map(({ route, frontmatter, markdown }) => `
        <li class="post-row">
          <a href="${route}">
            <div>
              <h2 class="post-row__title">${escapeHtml(frontmatter.title)}</h2>
              <p class="post-row__desc">${escapeHtml(frontmatter.description || excerpt(markdown, 120))}</p>
            </div>
            ${renderDate(frontmatter.date)}
          </a>
        </li>`).join('')}
    </ul>
  `
}

function handleRoute() {
  const path = window.location.pathname

  if (path === '/') {
    syncShell(path, 'page--home')
    renderHomePage()
  } else if (path === '/posts') {
    syncShell(path, 'page--list')
    renderPostsPage()
  } else {
    syncShell(path, 'page--article')
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
