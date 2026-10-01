import { escapeHtml, renderDate } from './html.js'
import { themeSwitch } from './theme.js'
import { titleLines, titleParts } from './titles.js'

// Home is a wall of bubbles: an identity column trailing its utility bubbles
// (about, the theme switch, the network links) and then one bubble per post
// plus a way into the full list. Cards are sized from their own titles, packed
// two to a column (the board simply grows sideways as more posts are
// published) and the columns scroll horizontally on wide screens and stack on
// phones.

// Size vocabulary: `weight` is the share of its column a card takes on wide
// screens, and the class also drives the type scale, so bigger titles get
// bigger bubbles instead of being crowded into small ones.
const CARD_SIZES = {
  large: { weight: 3 },
  medium: { weight: 2 },
  small: { weight: 1.2 }
}

// Two cards per column keeps the bubbles big; the board grows sideways.
const CARDS_PER_COLUMN = 2

// Latin glyphs run narrower than CJK ones, so English titles count for less.
// This is the floor the runtime may never deal under: a long bilingual title
// is never squeezed into a small bubble (the runtime reads it back from
// `data-floor` and rolls the rest of the board around it).
function sizeFor(zh, en) {
  const length = (zh || '').length + (en || '').length * 0.55
  if (length >= 26) return 'large'
  if (length >= 14) return 'medium'
  return 'small'
}

// Cards that carry a label and an arrow, like a door: the about page and the
// full post list wear the same shape.
function jumpCard(label, href, order) {
  return {
    weight: CARD_SIZES.small.weight,
    html: `
        <a class="home-card home-card--jump home-card--small" href="${escapeHtml(href)}" style="--order: ${order}">
          <span class="home-card__jump-row">
            <span class="home-card__jump-label">${escapeHtml(label)}</span>
            <span class="home-card__jump-arrow" aria-hidden="true">↗</span>
          </span>
        </a>`
  }
}

// The utility row under the identity card: deliberately small, content-sized
// bubbles. About keeps the jump-card shape, the theme switch and the network
// marks are the controls themselves, so neither card carries a label.
const ABOUT_BUBBLE = `<a class="home-card home-card--jump" href="/about">
            <span class="home-card__jump-row">
              <span class="home-card__jump-label">About</span>
              <span class="home-card__jump-arrow" aria-hidden="true">↗</span>
            </span>
          </a>`

const THEME_BUBBLE = `<div class="home-card home-card--utility home-card--theme">
            ${themeSwitch()}
          </div>`

const LINKS_BUBBLE = `<div class="home-card home-card--utility home-card--links">
            <ul class="chips">
              <li>
                <a class="chip chip--icon" href="https://x.com/kalasoo" title="X" aria-label="X">
                  <svg viewBox="0.05 0.01 23.97 23.97" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" />
                  </svg>
                </a>
              </li>
              <li>
                <a class="chip chip--icon" href="https://t.me/kalasoo" title="Telegram" aria-label="Telegram">
                  <svg viewBox="-1.21 -1.21 26.39 26.39" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true">
                    <path d="M23.91 3.79 20.3 20.84c-.25 1.21-.98 1.5-2 .94l-5.5-4.07-2.66 2.57c-.3.3-.55.56-1.1.56-.72 0-.6-.27-.84-.95L6.3 13.7l-5.45-1.7c-1.18-.35-1.19-1.16.26-1.75l21.26-8.2c.97-.43 1.9.24 1.53 1.73z" />
                  </svg>
                </a>
              </li>
              <li>
                <a class="chip chip--icon" href="https://github.com/kalasoo" title="GitHub" aria-label="GitHub">
                  <svg viewBox="0.04 -0.23 23.43 23.43" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>`

const IDENTITY_CARD = `<article class="home-card home-card--profile" style="--order: 0">
          <div class="profile__identity">
            <img src="/icon.png" alt="Yin Ming" class="profile__avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="icon-placeholder" style="display: none;">👨‍💻</div>
            <div>
              <h1 class="profile__name">阴明</h1>
              <p class="profile__handle">@kalasoo</p>
            </div>
          </div>
          <div class="profile__bio">
            <p class="profile__lead">我叫<strong>阴明</strong>，我致力于寻找人类与科技健康共存的方法。</p>
            <p class="profile__lead profile__lead--en">My name is <strong>Yin Ming</strong>, and I am dedicated to discovering ways for humanity and technology to coexist in harmony.</p>
          </div>
        </article>`

function postCard(post, index, order) {
  const { zh, en } = titleParts(post.frontmatter)
  const size = sizeFor(zh, en)

  return {
    weight: CARD_SIZES[size].weight,
    html: `
        <article class="home-card home-card--post home-card--${size}" data-floor="${size}" style="--order: ${order}">
          <a href="${escapeHtml(post.route)}">
            ${renderDate(post.frontmatter.date)}
            <h2 class="home-card__title">${titleLines(post.frontmatter)}</h2>
          </a>
        </article>`
  }
}

function chunk(cards, size) {
  const columns = []
  for (let i = 0; i < cards.length; i += size) {
    columns.push(cards.slice(i, i + size))
  }
  return columns
}

// Each column declares its own row rhythm, so a card's share of the column is
// exact — grid fractions, not flex growth, which the card padding would skew.
// The min-content floor keeps a control from clipping on short viewports; the
// profile card absorbs the difference.
function column(cards, modifier = '') {
  const rows = cards.map(card => `minmax(min-content, ${card.weight}fr)`).join(' ')
  return `
      <div class="home-board__col${modifier}" style="--rows: ${rows}">
        ${cards.map(card => card.html).join('')}
      </div>`
}

export function renderHomePage(posts) {
  const recentPosts = posts.slice(0, 10)

  // The identity column is one poster plus its row of small utility bubbles;
  // grid rows are the poster (all remaining room) and the row (content height).
  const identityColumn = `
      <div class="home-board__col home-board__col--profile" style="--rows: minmax(min-content, 1fr) auto">
        ${IDENTITY_CARD}
        <div class="home-utilities" style="--order: 1">
          ${ABOUT_BUBBLE}
          ${THEME_BUBBLE}
          ${LINKS_BUBBLE}
        </div>
      </div>`

  const cards = recentPosts.map((post, index) => postCard(post, index, index + 4))
  cards.push(jumpCard('Posts', '/posts', recentPosts.length + 4))

  const columns = chunk(cards, CARDS_PER_COLUMN)
    .map((group, index) => column(group, index % 2 === 0 ? ' home-board__col--wide' : ''))
    .join('')

  return `
    <div class="home-board" data-home-board role="region" aria-label="Home" tabindex="0">
      ${identityColumn}
      ${columns}
    </div>
  `
}

