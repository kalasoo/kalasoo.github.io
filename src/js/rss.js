import { siteConfig } from './config.js'

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function asCdata(value) {
  return String(value).replaceAll(']]>', ']]]]><![CDATA[>')
}

function excerpt(post) {
  const source = post.markdown || post.content || post.html || ''
  return source
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_`>[\]()~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

export function generateRSS(posts) {
  const latestTimestamp = Math.max(...posts.map(post => {
    const value = post.frontmatter.modified || post.frontmatter.date
    const timestamp = new Date(value).getTime()
    if (Number.isNaN(timestamp)) {
      throw new Error(`Invalid RSS date: ${value}`)
    }
    return timestamp
  }))
  const lastBuildDate = new Date(latestTimestamp).toUTCString()

  const rssItems = posts.map(post => {
    const pubDate = new Date(post.frontmatter.date).toUTCString()
    const link = `${siteConfig.baseURL}${post.route}`
    const description = post.frontmatter.description || excerpt(post)

    return `    <item>
      <title><![CDATA[${asCdata(post.frontmatter.title)}]]></title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${asCdata(description)}]]></description>
    </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${asCdata(siteConfig.title)}]]></title>
    <description><![CDATA[${asCdata(siteConfig.description)}]]></description>
    <link>${escapeXml(siteConfig.baseURL)}</link>
    <language>${escapeXml(siteConfig.languageCode)}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(siteConfig.author.rss)}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`
}