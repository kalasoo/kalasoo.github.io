console.log('🚀 App.js loading...')

import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import toml from 'toml'

console.log('📦 Dependencies loaded, importing content...')

function initThemeToggle() {
  const STORAGE_KEY = 'theme-preference'
  
  function getStoredTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'auto'
  }
  
  function setStoredTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme)
  }
  
  function applyTheme(theme) {
    const root = document.documentElement
    if (theme === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
    
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeBtn === theme)
    })
  }
  
  const storedTheme = getStoredTheme()
  applyTheme(storedTheme)
  
  document.querySelectorAll('[data-theme-btn]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeBtn
      setStoredTheme(theme)
      applyTheme(theme)
    })
  })
}

initThemeToggle()

import { content } from '../content/index.js'

console.log('✅ Content imported:', Object.keys(content))

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

function renderContent(route) {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  const markdownContent = content[route]
  if (!markdownContent) {
    contentDiv.innerHTML = '<h1>404 - Page Not Found</h1>'
    return
  }

  const { data: frontmatter, content: markdown } = matter(markdownContent, {
    engines: {
      toml: toml
    },
    language: 'toml',
    delimiters: '+++'
  })
  const html = md.render(markdown)

  contentDiv.innerHTML = `
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

function renderHomePage() {
  const contentDiv = document.getElementById('content')
  if (!contentDiv) return

  contentDiv.innerHTML = ''
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
              <time>${new Date(frontmatter.date).toLocaleDateString('zh-CN')}</time>
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

  contentDiv.innerHTML = ''
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

// Animated favicon: cycles Y → M → Y
;(function startAnimatedFavicon() {
  const letters = ['Y', 'M', 'Y']
  let index = 0
  let intervalId = null

  function ensureFaviconLink() {
    let link = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    return link
  }

  function isDarkMode() {
    const theme = document.documentElement.getAttribute('data-theme')
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Canvas-based smooth crossfade between Y and M
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  let rafId = null
  let lastFrameAt = 0
  const targetFps = 12 // keep it light; browsers throttle favicon changes anyway
  const frameInterval = 1000 / targetFps
  let t = 0 // 0..1 phase
  const cycleSeconds = 4.0 // full Y->M->Y cycle duration (slower)

  // Prepare offscreen letter canvases for pixel/tile transition
  const tileSize = 4 // 4px tiles → 16x16 grid
  const tilesX = Math.floor(size / tileSize)
  const tilesY = Math.floor(size / tileSize)
  const tilesCount = tilesX * tilesY
  let yCanvas = null
  let mCanvas = null
  let tileOrder = []

  function createLetterCanvas(letter) {
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const cctx = c.getContext('2d')
    cctx.clearRect(0, 0, size, size)
    const textColor = isDarkMode() ? '#e0e0e0' : '#222'
    cctx.textAlign = 'center'
    cctx.textBaseline = 'middle'
    cctx.font = '700 44px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Menlo, monospace'
    cctx.fillStyle = textColor
    cctx.fillText(letter, size / 2, size / 2)
    return c
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = array[i]
      array[i] = array[j]
      array[j] = tmp
    }
    return array
  }

  function rebuildLetterCanvases() {
    yCanvas = createLetterCanvas('Y')
    mCanvas = createLetterCanvas('M')
    // Build and shuffle tile order once
    tileOrder = new Array(tilesCount).fill(0).map((_, i) => i)
    shuffle(tileOrder)
  }

  rebuildLetterCanvases()

  function drawFrame(phase) {
    // Smooth 0→1→0 progression per full cycle
    const p = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase) // ease cosine
    const switched = Math.floor(p * tilesCount)

    ctx.clearRect(0, 0, size, size)

    for (let i = 0; i < tilesCount; i++) {
      const tileIndex = tileOrder[i]
      const tx = tileIndex % tilesX
      const ty = Math.floor(tileIndex / tilesX)
      const sx = tx * tileSize
      const sy = ty * tileSize
      const source = i < switched ? mCanvas : yCanvas
      ctx.drawImage(source, sx, sy, tileSize, tileSize, sx, sy, tileSize, tileSize)
    }
  }

  function render(now) {
    if (lastFrameAt === 0) lastFrameAt = now
    const delta = now - lastFrameAt
    if (delta >= frameInterval) {
      lastFrameAt = now
      // Advance phase
      t = (t + delta / (cycleSeconds * 1000)) % 1
      drawFrame(t)
      const link = ensureFaviconLink()
      link.type = 'image/png'
      link.href = canvas.toDataURL('image/png')
    }
    rafId = requestAnimationFrame(render)
  }

  function start() {
    if (rafId != null) return
    lastFrameAt = 0
    rafId = requestAnimationFrame(render)
  }

  function stop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  // Start immediately
  start()

  function updateFaviconColors() {
    rebuildLetterCanvases()
    drawFrame(t)
    const link = ensureFaviconLink()
    link.type = 'image/png'
    link.href = canvas.toDataURL('image/png')
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener?.('change', updateFaviconColors)
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'data-theme') {
        updateFaviconColors()
        break
      }
    }
  })
  observer.observe(document.documentElement, { attributes: true })

  // Pause when tab hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop()
    } else {
      start()
    }
  })
})()

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