import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
const commit = (process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()).slice(0, 8)
const buildTime = new Date().toISOString().slice(0, 16) + 'Z'

export default defineConfig({
  base: './',
  define: { __APP_BUILD_VERSION__: JSON.stringify(`${buildTime} · ${commit}`) },
  plugins: [react(), tailwindcss(), {
    name: 'preview-static-routes',
    configurePreviewServer(server) {
      // Mirror generated Cloudflare rewrites instead of previewing the SPA fallback.
      server.middlewares.use((request, _response, next) => {
        const path = (request.url || '').split('?')[0].replace(/\/$/, '')
        if (/^\/(about|resource\/[a-z0-9-]+)$/.test(path) && existsSync(resolve('dist', `.${path}/index.html`))) {
          request.url = `${path}/index.html`
        }
        next()
      })
    },
  }],
  server: {
    proxy: {
      '/api/la-county/locations': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
