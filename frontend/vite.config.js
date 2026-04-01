import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Proxy /api calls to the backend during local development.
    // This avoids CORS errors when both services run locally.
    // In production (Render), the frontend calls VITE_API_URL directly.
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      }
    }
  }
})
