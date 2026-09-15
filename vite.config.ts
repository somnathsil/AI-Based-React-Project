import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Dev-only proxy that fetches remote SVG/CDN assets server-side
 * so the browser avoids CORS when downloading Magnific/Flaticon icons.
 */
function svgAssetProxyPlugin(): Plugin {
  return {
    name: 'svg-asset-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/svg-asset',
        async (req: IncomingMessage, res: ServerResponse) => {
          try {
            const host = req.headers.host || 'localhost'
            const requestUrl = new URL(req.url || '/', `http://${host}`)
            const target = requestUrl.searchParams.get('url')

            if (!target) {
              res.statusCode = 400
              res.end('Missing url query parameter')
              return
            }

            let parsed: URL
            try {
              parsed = new URL(target)
            } catch {
              res.statusCode = 400
              res.end('Invalid url')
              return
            }

            const allowedHosts = [
              'cdn-icons.flaticon.com',
              'cdn-icons-png.flaticon.com',
              'cdn-icons-png.magnific.com',
              'cdn-icons.magnific.com',
              'api.magnific.com',
            ]
            if (!allowedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
              res.statusCode = 403
              res.end('Host not allowed')
              return
            }

            const upstream = await fetch(parsed.toString())
            const body = await upstream.text()
            res.statusCode = upstream.status
            res.setHeader(
              'Content-Type',
              upstream.headers.get('content-type') || 'image/svg+xml',
            )
            res.end(body)
          } catch (error) {
            res.statusCode = 502
            res.end(
              error instanceof Error ? error.message : 'Failed to fetch asset',
            )
          }
        },
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const magnificApiKey = env.MAGNIFIC_API_KEY || ''

  return {
    plugins: [react(), svgAssetProxyPlugin()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      proxy: {
        '/api/openrouter': {
          target: 'https://openrouter.ai/api',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
        },
        '/api/magnific': {
          target: 'https://api.magnific.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/magnific/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (magnificApiKey) {
                proxyReq.setHeader('x-magnific-api-key', magnificApiKey)
              }
            })
          },
        },
      },
    },
  }
})
