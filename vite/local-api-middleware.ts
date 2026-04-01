import { existsSync, readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Connect } from 'vite'

import instagramHandler from '../api/instagram-avatar.js'
import spotifyHandler from '../api/spotify.js'

const root = fileURLToPath(new URL('..', import.meta.url))

let spotifyEnvLoaded = false

function loadSpotifyServerEnv() {
  if (spotifyEnvLoaded) return
  spotifyEnvLoaded = true
  const envPath = resolve(root, '.env.spotify.server')
  if (!existsSync(envPath)) return
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

/** Vercel-style `res.status().json()` / `.end()` on Node’s ServerResponse. */
function wrapVercelResponse(res: ServerResponse) {
  return {
    setHeader(name: string, value: string | number | readonly string[]) {
      res.setHeader(name, value as string)
    },
    status(code: number) {
      res.statusCode = code
      return {
        json(body: unknown) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          res.end(JSON.stringify(body))
        },
        end(chunk?: string | Buffer) {
          res.end(chunk)
        },
      }
    },
  }
}

/**
 * Serves `api/*.js` handlers on the Vite dev server so `npm run dev` alone
 * handles `/api/spotify` and `/api/instagram-avatar` same-origin.
 */
export function localApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const path = (req.url ?? '').split('?')[0] ?? ''

    if (path === '/api/spotify') {
      loadSpotifyServerEnv()
      void spotifyHandler(req as IncomingMessage, wrapVercelResponse(res as ServerResponse))
      return
    }
    if (path === '/api/instagram-avatar') {
      void instagramHandler(req as IncomingMessage, wrapVercelResponse(res as ServerResponse))
      return
    }

    next()
  }
}
