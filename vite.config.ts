import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { promises as fs } from 'node:fs'
import path from 'node:path'

function devSeedFileApi() {
  const seedPath = path.resolve(__dirname, 'src/data/seed.json')

  return {
    name: 'dev-seed-file-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/__dev/seed/write') {
          next()
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body)
            await fs.writeFile(seedPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: 'src/data/seed.json' }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                message: error instanceof Error ? error.message : 'Failed to write seed file',
              }),
            )
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devSeedFileApi()],
})
