# Yin Ming's Personal Blog (@kalasoo)

A lightweight, fast personal blog built with Vite and vanilla JavaScript with static site generation (SSG). This blog explores the intersection of technology and humanity, dedicated to discovering ways for humanity and technology to coexist in harmony.

**Live Site**: [yinming.me](https://yinming.me) | **Author**: Yin Ming | **Contact**: [Telegram](https://t.me/kalasoo) | [X](https://x.com/kalasoo) | [GitHub](https://github.com/kalasoo)

## Technology Stack

- **Build Tool**: Vite 5.0+ (ES modules, HMR enabled)
- **Frontend**: Vanilla JavaScript (no frameworks)
- **Rendering**: Static Site Generation (SSG) for SEO, Client-side rendering for development
- **Content**: Markdown with TOML frontmatter
- **Styling**: Pure CSS
- **Deployment**: GitHub Pages
- **Domain**: yinming.me (configured via CNAME)

## Features

- **Ultra-lightweight**: No heavy frameworks, just Vite + markdown-it
- **Static Site Generation**: Pre-rendered HTML for optimal SEO
- **Markdown-first**: Write content in markdown, automatic routing
- **Media support**: Images and other assets handled automatically
- **Fast development**: Hot reload with Vite
- **Simple deployment**: One command to build and deploy
- **Animated favicon**: Cycles between 'Y' and 'M' letters
- **Bilingual support**: Chinese (zh-CN) primary with English content
- **Bubble board home**: the whole home page is one board of content-sized cards — profile, latest posts, and a link into the full list — packed into columns of different widths, scrolling sideways on desktops and stacking on phones (`src/js/home-board.js`)
- **SEO-friendly**: Static generation with proper meta tags and structured HTML

## Project Structure

```
src/
├── content/
│   ├── index.js              # Content imports and routing (for dev HMR)
│   ├── pages/                # Static pages (about, etc.)
│   └── posts/                # Blog posts
├── js/
│   ├── app.js               # Production theme and favicon runtime
│   ├── dev-router.js        # Development-only content router
│   ├── home.js              # Home bubble board markup (shared with the SSG)
│   ├── home-board.js        # Board runtime: rolled sizes, wheel input, phone waterfall
│   ├── entry.js             # Page chrome, hero, exit cards (shared with the SSG)
│   ├── list.js              # Full post list markup (shared with the SSG)
│   ├── reading.js           # Reading-time estimate
│   ├── theme.js             # Theme switch markup and runtime
│   ├── html.js              # Shared HTML escaping and <time> rendering
│   ├── toc.js               # Article contents rail and scroll spy
│   ├── titles.js            # Bilingual title lines and flat metadata titles
│   ├── config.js            # Site and SEO configuration
│   └── rss.js               # RSS feed generation
└── styles/
    └── main.css             # All styling

build-ssg.js                 # Static site generator (runs after Vite build)
```

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev
```

### Building

```bash
# Build for production (Vite build + static HTML generation)
npm run build

# Preview production build
npm run preview
```

The build process generates static HTML and discovery files:
- Each published post becomes a standalone HTML file (`/posts/filename.html`)
- Each published page becomes a standalone HTML file (`/about.html`, etc.)
- Draft content is excluded from pages, lists, RSS, and the sitemap
- Home page includes the recent posts list
- All pages include page-specific metadata and structured data
- `sitemap.xml`, `robots.txt`, and `rss.xml` are generated automatically

### Deployment

```bash
# Build and prepare for deployment
npm run deploy
```

## Architecture Patterns

### Rendering Strategy
- **Development**: Client-side rendering with HMR for fast iteration
- **Production**: Static site generation (SSG) for SEO and performance
- **Build Pipeline**: Vite build → Static HTML generation via `build-ssg.js`

### Content Management
- **Markdown-first**: All content written in markdown with TOML frontmatter
- **Static imports**: Content imported as raw strings via Vite's `?raw` suffix (dev mode)
- **Automatic routing**: File paths map directly to URL routes
- **HMR support**: Content changes trigger automatic reloads in dev mode

### Routing System
- **Development**: Client-side routing with History API (for HMR)
- **Production**: Static HTML files (`/posts/filename.html`)
- **Route mapping**: `/posts/filename` → `/src/content/posts/filename.md`
- **Navigation**: Intercepts link clicks for SPA behavior (dev), standard links (production)

### Rendering Pipeline
**Development (npm run dev)**:
1. Import markdown content as raw strings
2. Parse TOML frontmatter with `gray-matter`
3. Convert markdown to HTML with `markdown-it`
4. Render to DOM with consistent article structure

**Production (npm run build)**:
1. Vite builds JS/CSS assets
2. `build-ssg.js` scans markdown files
3. Generates static HTML for each page/post
4. Copies assets to `dist/` directory

## Adding Content

### New Blog Post
1. Create new `.md` file in `src/content/posts/`
2. Add TOML frontmatter with bilingual titles (`titleZh` / `titleEn`), search metadata, date, and draft status
3. Run `npm run dev` to see changes immediately (auto-detected by `src/content/index.js`)
4. Run `npm run build` to generate static HTML

### New Page
1. Create new `.md` file in `src/content/pages/`
2. Add TOML frontmatter
3. Run `npm run dev` to see changes immediately
4. Run `npm run build` to generate static HTML

### Static Generation
Run `npm run build` to generate static output. The build process will:
- Scan markdown files in `src/content/posts/` and `src/content/pages/`
- Exclude files with `draft = true`
- Generate HTML files in `dist/`
- Create `/posts/filename.html` for each published post
- Create `/filename.html` for each published page
- Update `dist/index.html` with recent posts
- Generate `sitemap.xml`, `robots.txt`, and `rss.xml`

**Note**: Content is automatically detected by `src/content/index.js` (for development) and `build-ssg.js` (for production). No manual registration needed - just create the markdown file!

### Images
Place in `public/` directory and reference with `/filename.ext`

## Content Format

### Frontmatter (TOML)

```toml
+++
titleZh = "中文标题"
titleEn = "English Title"
description = "A specific summary for search and social previews."
date = "2024-01-01"
draft = false
+++
```

Blog post titles are bilingual: `titleZh` and `titleEn` render as two stacked
lines in the article header, home cards and the posts list (Chinese leading,
English muted beneath it). Single-language pages such as `about` fill just one
field and render one line. Line-bound metadata — the browser title, RSS,
`og:title` and JSON-LD — joins a post's two titles with a `｜` bar.

### Markdown Content
- Standard markdown syntax
- HTML allowed (`html: true` in markdown-it config)
- Auto-linking enabled (`linkify: true`)
- Typography enhancements (`typographer: true`)

## Site Configuration

Located in `src/js/config.js`:

```javascript
export const siteConfig = {
  title: '@kalasoo',
  description: '阴明的个人博客，记录 AI、Vibe Coding、产品、内容平台与科技社会的长期思考。',
  seoTitle: '阴明 kalasoo',
  baseURL: 'https://yinming.me',
  languageCode: 'zh-cn',
  googleAnalytics: 'G-VGRZT9T626',
  author: {
    name: 'Yin Ming',
    email: 'ym.kalasoo@gmail.com',
    github: 'https://github.com/kalasoo',
    x: 'https://x.com/kalasoo',
    telegram: 'https://t.me/kalasoo'
  }
}
```

## Special Features

### Animated Favicon
- Cycles between 'Y' and 'M' letters
- Canvas-based smooth transitions
- Respects dark/light mode preferences
- Pauses when tab is hidden

### Contents Rail
- Articles with three or more h1–h3 headings get a sticky contents card beside the body — `src/js/toc.js` slugifies the headings into anchors and tracks the reader with a scroll spy
- The rail opens from 72rem up; below that the article keeps the full shell width, and the reading column simply uses the space
- Indentation is relative to the shallowest heading in the piece, so an article written entirely in h3s is not indented as if nested

### Home Bubble Board
- The home page is pure board, with no chrome of its own: it renders an identity card (avatar, 阴明 / @kalasoo and the bilingual bio), utility bubbles, one card per recent post, and an index card linking to `/posts`
- Under the identity card sits one row of three equal pills, together exactly as wide as the identity card above them — the row stays three across on phones, where the pills just get narrower
- Those pills are the controls themselves, with no surface inside a surface: the theme switch's three segments (Light | System | Dark) sit straight on the card, and the X / Telegram / GitHub marks are the links card's three equal tap zones. Navigation cards (About, Posts) keep their label low-left like every other card, with a `↗` beside it — the same arrow the read mark uses on a hovered post
- The build only writes a *floor* per post into `data-floor` (title length, so a long bilingual title is never squeezed into a small bubble). The runtime rolls the rest: on wide screens a pool with a fixed mix — two big, two medium, two small — is shuffled over the posts on **every visit**, each card's height share jitters around its class, and the newest two stay at medium or above to lead the board. Phones skip the roll and the size vocabulary entirely — one size for every card
- Phones pack the same cards into two columns by height (`src/js/home-board.js`) — a real waterfall, cards falling into whichever column is shorter, not rows of equal height. Mobile also drops the size vocabulary: every card takes the same class, so the heights come from the titles alone. The identity card and the utility pills stay full width above the waterfall, and without JS the board falls back to the plain stacked list (the build-time columns dissolve via `display: contents` and each card carries `--order`, newest first)
- Switching breakpoints moves the cards between the two arrangements, and the waterfall re-packs on resize; a dev re-render simply re-initialises the board
- The board carries 8px of vertical padding as headroom for the 4px hover lift, so a card in the top row is never sliced by the track's own overflow
- Columns are not all the same width — the identity column leads at 1.45×, then wide and normal columns alternate — and each column declares its own row rhythm (`minmax(min-content, 3fr)`-style rows), so a card's share of the column is exact, no column has holes, and a short viewport shrinks the profile text rather than clipping the controls
- The board is full-bleed rather than a centred column: the shell drops its max-width and uses the site gutter (`--gap`) on every side and between cards, so the gaps above, below and between the bubbles match
- From 60rem the board becomes a fixed-height canvas that scrolls sideways: `src/js/home-board.js` spends wheel and trackpad input sideways, relaxes scroll snapping while the wheel moves and re-arms it on settle, so the board lands on a column
- The board is a focusable scroll region, so arrow keys walk it column by column once it has focus

### Detail Pages
- Every page but the board opens with one floating pill — `@kalasoo ↗`, back to the board — sticking to the top of the column; there is no header bar and no second pill
- The hero card carries the piece's identity and nothing else: the date, and the title in both languages. No reading-time badge, no generated summary — the description stays in the metadata where it belongs
- The theme switch lives on the board alone; other pages inherit whatever the root `data-theme` attribute says
- The list page wears the same chrome and a hero card of its own (`5 posts`), with the rows below it
- The body is a card, and that is where a detail page ends: a contents rail whenever the piece has three or more headings, plus a back-to-top pill once a read passes six minutes and the first screen is scrolled away

### Theme Control
- Auto (system) → light → dark, stored as `theme-preference`: the three-way switch sits on the home board, and every other page follows the root `data-theme` attribute it sets
- Follows the OS by default; a pinned theme is applied before first paint
- The button's active icon is chosen in CSS from the root `data-theme` attribute; the switch marks its own segment with `aria-pressed`

### Typography
- Schibsted Grotesk (SIL OFL, `public/fonts`) is self-hosted as one variable file and preloaded on every page, so every weight the site uses (400–900) comes from a single request
- The face is latin-subset on purpose: Chinese text falls through to the platform faces (PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, Microsoft YaHei) rather than shipping megabytes of CJK
- Display type is big, light and tight, labels are small, uppercase and letter-spaced — both driven by the type tokens at the top of `src/styles/main.css`

### Bilingual Support
- Chinese (zh-CN) as primary language
- English content mixed throughout
- Post titles are split into `titleZh` / `titleEn` and rendered as two stacked lines — English tagged with `lang="en"` — via `src/js/titles.js`; page headings (`Posts`, `About`) stay single-line and metadata keeps the single-line `中文｜English` form
- Date formatting in Chinese locale

### Performance Optimizations
- **Ultra-lightweight**: No frameworks, minimal JavaScript
- **Static HTML**: Pre-rendered pages for instant load
- **Vite optimization**: Tree-shaking and code splitting
- **Fast development**: HMR for content changes
- **SEO optimized**: Meta tags, semantic HTML, structured content

## Dependencies

### Production Dependencies
- `gray-matter`: Parse frontmatter from markdown files
- `markdown-it`: Convert markdown to HTML
- `toml`: Parse TOML frontmatter

### Development Dependencies
- `vite`: Build tool and dev server
- `vite-plugin-node-polyfills`: Node.js polyfills for browser

## Code Style Guidelines

### JavaScript
- ES6+ modules
- Vanilla JavaScript (no frameworks)
- Functional programming patterns
- Clear, descriptive variable names

### CSS
- Single stylesheet (`main.css`)
- Mobile-first responsive design
- CSS custom properties for theming
- Semantic class names

### Markdown
- TOML frontmatter (not YAML)
- Consistent heading hierarchy
- Proper link formatting
- Code blocks with language specification

## Troubleshooting

### Common Issues
- **Content not updating**: Check `src/content/index.js` imports
- **Routing issues**: Verify route mapping in content object
- **Build failures**: Check Vite config and dependencies
- **Styling problems**: Validate CSS syntax and selectors

### Development Tips
- Use browser dev tools for debugging
- Leverage Vite's HMR for rapid iteration
- Check console for JavaScript errors
- Validate markdown syntax and frontmatter

## Customization

- **Styling**: Edit `src/styles/main.css`
- **Navigation**: the pills live in `pageTools()` (`src/js/entry.js`); there is no header bar
- **Site config**: Edit `src/js/config.js` for site-wide settings
- **Content**: Add new posts/pages in `src/content/` directories