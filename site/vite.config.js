import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set VITE_API_URL in .env to point the app at the real API.
// The proxy below lets you call "/api/..." during development without CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
