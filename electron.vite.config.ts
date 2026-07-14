import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Dev-only helper so the renderer can load the news feed in a plain browser (no CORS).
// The packaged app never uses this route — it fetches via the Electron main process over IPC.
function newsDevProxy(): Plugin {
  return {
    name: 'daybook-news-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/news', (_req, res) => {
        fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json')
          .then((r) => r.text())
          .then((body) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(body)
          })
          .catch((err: unknown) => {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: String(err) }))
          })
      })
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), newsDevProxy()]
  }
})
