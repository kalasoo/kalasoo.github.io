// Small HTML helpers shared by the static generator, the dev router and the
// page renderers, so escape rules and <time> stamps stay identical everywhere.
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function renderDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`)
  }

  return `<time datetime="${date.toISOString()}">${date.toLocaleDateString('zh-CN')}</time>`
}
