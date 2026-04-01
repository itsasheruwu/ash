#!/usr/bin/env node
/**
 * Local mirror of api/instagram-avatar.js.
 * Prefer `npm run dev`: Vite serves /api/instagram-avatar on the same origin.
 * Run: npm run instagram:local-api
 * Default port 3003; override: INSTAGRAM_AVATAR_LOCAL_PORT=3004 npm run instagram:local-api
 * Match .env: VITE_INSTAGRAM_AVATAR_URL=http://127.0.0.1:3003/api/instagram-avatar
 */

import { createServer } from 'node:http'
import process from 'node:process'

const handler = (await import('../api/instagram-avatar.js')).default
const PORT = Number(process.env.INSTAGRAM_AVATAR_LOCAL_PORT) || 3003
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
    process.stderr.write(`\nPort ${PORT} is already in use.\n\n`)
    process.stderr.write(`Try:\n  lsof -ti :${PORT} | xargs kill\n`)
    process.stderr.write(
      `Or: INSTAGRAM_AVATAR_LOCAL_PORT=3004 npm run instagram:local-api\n` +
        `Then set VITE_INSTAGRAM_AVATAR_URL=http://127.0.0.1:3004/api/instagram-avatar\n\n`,
    )
    process.exit(1)
  }
  throw err
})

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `Instagram avatar API (local): http://${HOST}:${PORT}/api/instagram-avatar?username=YOURUSER\n` +
      'Keep this running while you use npm run dev.\n',
  )
})
