import { escapeHtml } from './html.js'

// Bilingual titles. Every content file carries `titleZh` and `titleEn` in its
// frontmatter; Chinese leads and English follows. Surfaces pick the shape:
// headings and cards stack the two lines (titleLines), while single-line
// metadata — <title>, og:title, JSON-LD, RSS — joins them with a bar
// (flatTitle). Either field may be missing for single-language content.
const FALLBACK_TITLE = 'Untitled'
const TITLE_SEPARATOR = '｜'

function toText(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || null
}

export function titleParts(frontmatter = {}) {
  const zh = toText(frontmatter.titleZh)
  const en = toText(frontmatter.titleEn)

  return zh || en ? { zh, en } : { zh: FALLBACK_TITLE, en: null }
}

// One line, for places that cannot wrap.
export function flatTitle(frontmatter = {}) {
  const { zh, en } = titleParts(frontmatter)
  return [zh, en].filter(Boolean).join(TITLE_SEPARATOR)
}

// Two stacked lines: the Chinese title on its own line and the English title
// beneath it, tagged with its language so screen readers switch voice.
export function titleLines(frontmatter = {}) {
  const { zh, en } = titleParts(frontmatter)

  return [
    zh ? `<span class="title-zh">${escapeHtml(zh)}</span>` : '',
    en ? `<span class="title-en" lang="en">${escapeHtml(en)}</span>` : ''
  ].filter(Boolean).join('\n')
}
