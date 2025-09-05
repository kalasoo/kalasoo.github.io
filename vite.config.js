import { defineConfig } from 'vite'
import { resolve } from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  root: '.',
  plugins: [
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  preview: {
    port: 3000,
    open: true
  },
  server: {
    port: 3000,
    open: true,
    historyApiFallback: true
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['gray-matter']
  },
  // Markdown files are handled via direct imports
})