import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import toml from 'toml'
import { pageTools, renderEntry } from './entry.js'
import { renderHomePage } from './home.js'
import { initHomeBoard } from './home-board.js'
import { renderPostList } from './list.js'
import { readingMinutes } from './reading.js'
import { initTheme } from './theme.js'
import { content } from '../content/index.js'
import { initToc } from './toc.js'

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

function publishedEntries(prefix) {
  return Object.entries(content)
    .filter(([route]) => route.startsWith(prefix))
    .map(([route, markdownContent]) => {
      const { data: frontmatter, content: markdown } = parseContent(markdownContent)
      return { route, frontmatter, markdown }
    })
    .filter(({ frontmatter }) => frontmatter.draft !== true)
}

// Keep the dev shell in step with the static template: the page class, and the
// floating pills on every page but the board itself.
function syncShell(path, pageClass) {
  document.body.className = `page ${pageClass}`

  let tools = document.querySelector('.page-tools')

  if (path === '/') {
    tools?.remove()
    return
  }

  if (!tools) {
    const holder = document.createElement('div')
    holder.innerHTML = pageTools()
    tools = holder.firstElementChild
    document.querySelector('.shell')?.prepend(tools)
    initTheme(tools)
  }
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

  contentDiv.innerHTML = renderEntry({
    frontmatter,
    html: md.render(markdown),
    minutes: readingMinutes(markdown),
    sectionsAsCards: frontmatter.sectionsAsCards === true
  })

  initToc(contentDiv)
}

function renderHomeRoute() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const posts = publishedEntries('/posts/')
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))

  contentDiv.innerHTML = renderHomePage(posts)
  initHomeBoard(contentDiv)
  initTheme(contentDiv)
}

function renderPostsPage() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const posts = publishedEntries('/posts/')
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))

  contentDiv.innerHTML = renderPostList(posts)
}

function handleRoute() {
  const path = window.location.pathname

  if (path === '/') {
    syncShell(path, 'page--home')
    renderHomeRoute()
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

  // In-page anchors (#heading) stay native: there is nothing to re-render, and
  // the browser owns the jump.
  if (link.hash && link.pathname === window.location.pathname) return

  event.preventDefault()
  window.history.pushState({}, '', link.href)
  handleRoute()
})

handleRoute()

if (import.meta.hot) {
  import.meta.hot.accept('../content/index.js', handleRoute)
}
