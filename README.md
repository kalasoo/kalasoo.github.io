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
- **SEO-friendly**: Static generation with proper meta tags and structured HTML

## Project Structure

```
src/
├── content/
│   ├── index.js              # Content imports and routing (for dev HMR)
│   ├── pages/                # Static pages (about, etc.)
│   └── posts/                # Blog posts
├── js/
│   ├── app.js               # Main application logic
│   ├── config.js            # Site configuration
│   ├── build.js             # Build utilities
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

The build process now generates static HTML files for optimal SEO:
- Each post becomes a standalone HTML file (`/posts/filename.html`)
- Each page becomes a standalone HTML file (`/about.html`, etc.)
- Home page includes recent posts list
- All pages include proper meta tags and structured content

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
2. Add TOML frontmatter with title, date, draft status
3. Run `npm run dev` to see changes immediately (auto-detected by `src/content/index.js`)
4. Run `npm run build` to generate static HTML

### New Page
1. Create new `.md` file in `src/content/pages/`
2. Add TOML frontmatter
3. Run `npm run dev` to see changes immediately
4. Run `npm run build` to generate static HTML

### Static Generation
Run `npm run build` to generate static HTML files. The build process will:
- Automatically scan all markdown files in `src/content/posts/` and `src/content/pages/`
- Generate HTML files in `dist/` directory
- Create `/posts/filename.html` for each post
- Create `/filename.html` for each page
- Update `dist/index.html` with recent posts

**Note**: Content is automatically detected by `src/content/index.js` (for development) and `build-ssg.js` (for production). No manual registration needed - just create the markdown file!

### Images
Place in `public/` directory and reference with `/filename.ext`

## Content Format

### Frontmatter (TOML)
```toml
+++
title = "Post Title"
date = "2024-01-01"
draft = false
+++
```

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
  description: 'kalasoo\'s blog',
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

### Bilingual Support
- Chinese (zh-CN) as primary language
- English content mixed throughout
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
- **Navigation**: Edit the nav section in `index.html`
- **Site config**: Edit `src/js/config.js` for site-wide settings
- **Content**: Add new posts/pages in `src/content/` directories