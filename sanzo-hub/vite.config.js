import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // La API de Buffer bloquea CORS y además pide explícitamente no
      // llamarla desde el navegador. En dev, este proxy hace de intermediario
      // (reenvía tal cual, con el header Authorization que ya manda el
      // cliente); en producción cumple el mismo rol la función serverless de
      // Vercel en api/buffer.js. Ver src/lib/buffer.js.
      '/api/buffer': {
        target: 'https://api.buffer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/buffer/, '/'),
      },
    },
  },
})
