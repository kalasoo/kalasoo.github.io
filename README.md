# Yin Ming's Personal Blog

A lightweight, fast personal blog built with Vite and vanilla JavaScript.

## Features

- **Ultra-lightweight**: No heavy frameworks, just Vite + markdown-it
- **Markdown-first**: Write content in markdown, automatic routing
- **Media support**: Images and other assets handled automatically
- **Fast development**: Hot reload with Vite
- **Simple deployment**: One command to build and deploy

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building

```bash
# Build for production
npm run build
```

### Deployment

```bash
# Deploy to GitHub Pages
npm run deploy
```

## Content Structure

```
src/
├── content/
│   ├── pages/          # Static pages (about, etc.)
│   └── posts/          # Blog posts
├── js/
│   ├── main.js         # Main application logic
│   ├── rss.js          # RSS feed generation
│   └── build.js        # Build utilities
└── styles/
    └── main.css        # Styling
```

## Adding Content

1. **New blog post**: Create a new `.md` file in `src/content/posts/`
2. **New page**: Create a new `.md` file in `src/content/pages/`
3. **Images**: Place in `public/` directory and reference with `/filename.ext`

## Frontmatter

Each markdown file should start with frontmatter:

```yaml
---
title: "Your Title"
date: "2024-01-01"
draft: false
---
```

## Customization

- **Styling**: Edit `src/styles/main.css`
- **Navigation**: Edit the nav section in HTML files
- **Site config**: Edit the JavaScript files for site-wide settings