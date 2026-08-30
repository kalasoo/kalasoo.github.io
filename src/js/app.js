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

// Animated favicon: cycles Y → M → Y
;(function startAnimatedFavicon() {

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

if (import.meta.env.DEV) {
  import('./dev-router.js')
}
