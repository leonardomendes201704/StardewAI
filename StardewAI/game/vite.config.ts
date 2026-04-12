import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  define: {
    'process.env': {}
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
  },
  build: {
    target: 'ES2020'
  }
})
