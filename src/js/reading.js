// Reading time. CJK runs on characters and latin on words, so a bilingual post
// is not measured in the wrong unit; the result rounds up and is never zero.
export function readingMinutes(markdown = '') {
  const text = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')

  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length
  const words = (text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, ' ')
    .match(/[A-Za-z][A-Za-z'’-]*/g) || []).length

  return Math.max(1, Math.round(cjk / 400 + words / 220))
}
