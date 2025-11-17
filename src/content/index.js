// Simple content imports - let Vite handle HMR automatically
import aboutContent from './pages/about.md?raw'
import testContent from './pages/test.md?raw'
import post1Content from './posts/3-poisons.md?raw'
import post2Content from './posts/engine-head-platform.md?raw'
import post3Content from './posts/one-person-unicorn.md?raw'
import post4Content from './posts/reflections-on-vibe-coding-2025.md?raw'

// Export all content in a simple object
export const content = {
  '/about': aboutContent,
  '/test': testContent,
  '/posts/3-poisons': post1Content,
  '/posts/engine-head-platform': post2Content,
  '/posts/one-person-unicorn': post3Content,
  '/posts/reflections-on-vibe-coding-2025': post4Content
}