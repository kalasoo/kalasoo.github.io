import matter from 'gray-matter'

// RSS feed generator
export function generateRSS(posts) {
  const siteUrl = 'https://yinming.me'
  const lastBuildDate = new Date().toUTCString()
  
  const rssItems = posts.map(post => {
    const pubDate = new Date(post.frontmatter.date).toUTCString()
    const link = `${siteUrl}${post.route}`
    
    return `
      <item>
        <title><![CDATA[${post.frontmatter.title}]]></title>
        <link>${link}</link>
        <guid isPermaLink="true">${link}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${post.frontmatter.description || post.content.substring(0, 200)}...]]></description>
      </item>
    `
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ming Yin｜阴明｜@kalasoo</title>
    <description>Personal blog exploring the intersection of technology and humanity</description>
    <link>${siteUrl}</link>
    <language>zh-cn</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`
}