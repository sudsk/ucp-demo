import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/chat': 'http://localhost:8000',
      '/set-persona': 'http://localhost:8000',
      '/personas': 'http://localhost:8000',
      '/.well-known': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
})
