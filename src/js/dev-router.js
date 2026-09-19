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
          ? '<footer class="post__foot"><a class="chip" href="/posts">All posts</a></footer>'
          : ''}
      </div>
    </article>
  `
}

function postCard(post, index) {
  const variant = index === 0 ? ' post-card--feature' : (index === 4 ? ' post-card--wide' : '')
  const { route, frontmatter, markdown } = post
  const description = frontmatter.description || excerpt(markdown, index === 0 ? 180 : 120)

  return `
    <li class="post-card${variant}">
      <a href="${route}">
        ${renderDate(frontmatter.date)}
        <h2 class="post-card__title">${escapeHtml(frontmatter.title)}</h2>
        <p class="post-card__desc">${escapeHtml(description)}</p>
      </a>
    </li>`
}

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
      <h1>All Posts</h1>
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
