import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env from the project ROOT (one level up from /frontend)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')

  return {
    plugins: [react()],
    define: {
      // Expose all VITE_ prefixed variables from root .env to the app
      ...Object.fromEntries(
        Object.entries(env)
          .filter(([key]) => key.startsWith('VITE_'))
          .map(([key, val]) => [`import.meta.env.${key}`, JSON.stringify(val)])
      ),
    },
    server: {
      port: 5173,
      strictPort: true,
      // Proxy /api calls to backend during local development
      proxy: {
        '/api': {
          target: `http://localhost:${env.SERVER_PORT || 8083}`,
          changeOrigin: true,
        }
      }
    }
  }
})
