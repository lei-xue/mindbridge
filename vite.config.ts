import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/la-county/locations': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
