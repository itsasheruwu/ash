#!/usr/bin/env node
/**
 * Local mirror of api/spotify.js. Loads secrets from .env.spotify.server.
 * Prefer `npm run dev`: Vite serves /api/spotify on the same origin.
 * Run: npm run spotify:local-api
 * Default port 3001; override: SPOTIFY_LOCAL_API_PORT=3002 npm run spotify:local-api
 * Match .env: VITE_SPOTIFY_STATUS_URL=http://127.0.0.1:<port>/api/spotify
 */

import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(root, '.env.spotify.server')

function loadServerEnv() {
  if (!existsSync(envPath)) {
    console.error(`Missing ${envPath}. Run npm run setup:spotify first.`)
    process.exit(1)
  }
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    const value = t.slice(eq + 1).trim()
    if (key.startsWith('SPOTIFY_')) process.env[key] = value
  }
}

loadServerEnv()

const handler = (await import('../api/spotify.js')).default
const PORT = Number(process.env.SPOTIFY_LOCAL_API_PORT) || 3001
const HOST = '127.0.0.1'

const server = createServer((req, res) => {
  const vercelRes = {
    setHeader(k, v) {
      res.setHeader(k, v)
    },
    status(code) {
      res.statusCode = code
      return {
        json(body) {
          if (!res.getHeader('Content-Type')) {
            res.setHeader('Content-Type', 'application/json')
          }
          res.end(JSON.stringify(body))
        },
        end(chunk) {
          res.end(chunk ?? '')
        },
      }
    },
  }

  void handler(req, vercelRes)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    process.stderr.write(`\nPort ${PORT} is already in use (another spotify:local-api or other app).\n\n`)
    process.stderr.write(`Free it on macOS:\n  lsof -ti :${PORT} | xargs kill\n\n`)
    process.stderr.write(`Or use a different port:\n  SPOTIFY_LOCAL_API_PORT=3002 npm run spotify:local-api\n`)
    process.stderr.write(
      `Then update .env to match:\n  VITE_SPOTIFY_STATUS_URL=http://127.0.0.1:3002/api/spotify\n\n`,
    )
    process.exit(1)
  }
  throw err
})

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `Spotify API (local): http://${HOST}:${PORT}/api/spotify\n` +
      'Keep this running while you use npm run dev.\n',
  )
})
