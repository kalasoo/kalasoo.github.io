// Article contents rail: reads the h1–h3 headings the piece actually uses, gives
// them stable ids, and parks a sticky list beside the body that tracks where the
// reader is. Indentation is relative to the shallowest level in the piece, so a
// piece written in h3s is not indented as if it were nested. Without JavaScript
// the article renders untouched.

const MIN_HEADINGS = 3
const ACTIVE_LINE = 140

function slugify(text) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug.slice(0, 60) || 'section'
}

export function initToc(root = document) {
  const entry = root.querySelector('.entry')
  const content = entry?.querySelector('.content')

  if (!entry || !content || entry.querySelector('.toc')) return

  const headings = [...content.querySelectorAll('h1, h2, h3')]
    .filter(heading => heading.textContent.trim())

  if (headings.length < MIN_HEADINGS) return

  const base = Math.min(...headings.map(heading => Number(heading.tagName.slice(1))))

  const taken = new Set()
  for (const heading of headings) {
    const slug = slugify(heading.textContent)
    let id = heading.id || slug
    let suffix = 2

    while (taken.has(id)) id = `${slug}-${suffix++}`
    taken.add(id)
    heading.id = id
  }

  const nav = document.createElement('nav')
  nav.className = 'toc'
  nav.setAttribute('aria-label', 'Contents')

  const list = document.createElement('ul')
  list.className = 'toc__list'

  const links = headings.map(heading => {
    const depth = Number(heading.tagName.slice(1)) - base

    const item = document.createElement('li')
    item.className = 'toc__item'
    if (depth > 0) item.style.setProperty('--toc-depth', String(depth))

    const link = document.createElement('a')
    link.href = `#${heading.id}`
    link.textContent = heading.textContent.trim()

    item.append(link)
    list.append(item)
    return link
  })

  nav.append(list)
  entry.append(nav)

  let active = null
  const activate = link => {
    if (link === active) return
    active?.classList.remove('is-active')
    active?.removeAttribute('aria-current')

    active = link
    active?.classList.add('is-active')
    active?.setAttribute('aria-current', 'location')
  }

  const sync = () => {
    if (!nav.isConnected) {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      return
    }

    const line = window.scrollY + ACTIVE_LINE
    let index = 0

    headings.forEach((heading, i) => {
      if (heading.getBoundingClientRect().top + window.scrollY <= line) index = i
    })

    // The last heading may never cross the line on a short piece.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      index = headings.length - 1
    }

    activate(links[index])
  }

  let frame = 0
  function onScroll() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      sync()
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  sync()
}
