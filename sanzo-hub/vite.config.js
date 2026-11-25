import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
// En desarrollo sirve /api/meta con la misma función que usa Vercel
// (api/meta.js). El token se lee de .env (META_ACCESS_TOKEN, sin VITE_
// adelante, así nunca llega al navegador).
function metaApiDev(env) {
  return {
    name: 'sanzo-meta-api-dev',
    configureServer(server) {
      for (const k of ['META_ACCESS_TOKEN', 'META_API_VERSION', 'META_AD_ACCOUNT_ID', 'META_IG_USER_ID']) {
        if (env[k] && !process.env[k]) process.env[k] = env[k]
      }
      server.middlewares.use('/api/meta', async (req, res) => {
        const { default: handler } = await server.ssrLoadModule('/api/meta.js')
        req.url = '/api/meta' + (req.url === '/' ? '' : req.url)
        await handler(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), metaApiDev(loadEnv(mode, process.cwd(), ''))],
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
}))
