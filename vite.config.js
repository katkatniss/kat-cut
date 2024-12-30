import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base:'/kat-cut',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg'],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-policy",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  }
})
