import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        posts: resolve(__dirname, 'posts.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})