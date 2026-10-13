/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(__dirname, '..')

// Copies supabase.min.js and supabase_client.js from the repo root into dist
// at build time, and serves them from the repo root in the dev server.
// This avoids duplicating the files (they remain authoritative at the repo root).
function honeydbPlugin(): Plugin {
  return {
    name: 'honeydb-assets',
    writeBundle(opts) {
      const outDir = typeof opts.dir === 'string' ? opts.dir : resolve(__dirname, 'dist')
      copyFileSync(resolve(repoRoot, 'supabase.min.js'), resolve(outDir, 'supabase.min.js'))
      copyFileSync(resolve(repoRoot, 'supabase_client.js'), resolve(outDir, 'supabase_client.js'))
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]
        if (url === '/supabase.min.js') {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
          res.end(readFileSync(resolve(repoRoot, 'supabase.min.js')))
          return
        }
        if (url === '/supabase_client.js') {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
          res.end(readFileSync(resolve(repoRoot, 'supabase_client.js')))
          return
        }
        next()
      })
    },
  }
}

export default defineConfig(({ command }) => ({
  // GitHub Pages publishes at /HoneyOS/. Use that base for production builds
  // only; dev server and vite preview are invoked with explicit --base to
  // avoid breaking dev/visual tests that navigate to the server root.
  base: command === 'build' ? '/HoneyOS/' : '/',
  plugins: [react(), honeydbPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../supabase/functions/**/*.test.ts'],
  },
}))
