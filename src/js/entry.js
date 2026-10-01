import { escapeHtml, renderDate } from './html.js'
import { siteConfig } from './config.js'
import { titleLines } from './titles.js'

// Detail pages share one skeleton: a hero card (the date and the title in both
// languages), the body card, and — where they earn their room — a contents
// rail and a back-to-top pill, both declared here as data so the runtime does
// not have to re-derive them.

// Three headings is where a contents rail starts to earn its room; six minutes
// is where a reader wants a way back up.
const TOC_HEADINGS = 3
const TOP_MINUTES = 6

// A page whose own frontmatter asks for it renders each top-level section as
// its own card — the same bubble language the home board speaks.
function cardSections(html) {
  return String(html)
    .split(/(?=<h3[\s>])/)
    .filter(part => part.trim())
    .map(part => `<section class="section-card">\n${part.trim()}\n</section>`)
    .join('\n')
}

// The chrome every page but the board wears: the wordmark back to the board,
// and nothing else. It sticks to the top of the column.
export function pageTools() {
  return `<div class="page-tools">
      <a class="page-pill" href="/">${escapeHtml(siteConfig.title)}<span class="page-pill__arrow" aria-hidden="true">↗</span></a>
    </div>`
}

export function renderEntry({ frontmatter = {}, html = '', minutes = 0, sectionsAsCards = false }) {
  const headings = (html.match(/<h[1-3][\s>]/g) || []).length
  const showToc = headings >= TOC_HEADINGS
  const showTop = minutes >= TOP_MINUTES

  // The hero is the piece's identity and nothing else: when it was written,
  // and the title in both languages.
  const meta = frontmatter.date ? renderDate(frontmatter.date) : ''

  return `
    <article class="entry" data-toc="${showToc}">
      <header class="entry__hero">
        ${meta ? `<p class="entry__meta">
          ${meta}
        </p>` : ''}
        <h1 class="entry__title">${titleLines(frontmatter)}</h1>
      </header>
      <div class="entry__body">
        <div class="content">
          ${sectionsAsCards ? cardSections(html) : html}
        </div>
      </div>
      ${showTop ? `<button type="button" class="back-to-top" data-back-to-top hidden aria-label="回到顶部">↑</button>` : ''}
    </article>
  `
}
