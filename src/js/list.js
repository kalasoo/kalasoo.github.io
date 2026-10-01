import { escapeHtml, renderDate } from './html.js'
import { titleLines } from './titles.js'

// The full list: the same board language as everywhere else — a hero card
// (how many posts there are, the title) and then the rows, one card per post.
export function renderPostList(posts) {
  return `
    <header class="entry__hero">
      <p class="entry__meta"><span class="entry__label">${posts.length} posts</span></p>
      <h1 class="entry__title">Posts</h1>
    </header>
    <ul class="post-rows">
      ${posts.map(post => `
        <li class="post-row">
          <a href="${escapeHtml(post.route)}">
            <h2 class="post-row__title">${titleLines(post.frontmatter)}</h2>
            ${renderDate(post.frontmatter.date)}
          </a>
        </li>`).join('')}
    </ul>
  `
}
