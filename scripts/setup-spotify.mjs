#!/usr/bin/env node
/**
 * Interactive Spotify setup: OAuth code → refresh token, local env files.
 * Run: npm run setup:spotify
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import readline from 'node:readline/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = resolve(root, '.env')
const SERVER_ENV_FILE = resolve(root, '.env.spotify.server')

const SCOPES = ['user-read-currently-playing', 'user-read-recently-played'].join(' ')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function ask(question, { default: defaultValue } = {}) {
  const hint = defaultValue !== undefined && defaultValue !== '' ? ` [${defaultValue}]` : ''
  const answer = (await rl.question(`${question}${hint}: `)).trim()
  if (answer) return answer
  if (defaultValue !== undefined) return defaultValue
  return ''
}

function upsertEnvKeys(filePath, updates, bannerIfNew) {
  const existed = existsSync(filePath)
  let raw
  if (existed) {
    raw = readFileSync(filePath, 'utf8')
  }

  const keysToSet = new Set(Object.keys(updates))
  const lines = !raw || raw === '' ? [] : raw.split('\n')
  const replaced = new Set()
  const out = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      out.push(line)
      continue
    }
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      out.push(line)
      continue
    }
    const key = trimmed.slice(0, eq).trim()
    if (keysToSet.has(key)) {
      replaced.add(key)
      out.push(`${key}=${updates[key]}`)
    } else {
      out.push(line)
    }
  }

  for (const key of keysToSet) {
    if (!replaced.has(key)) {
      out.push(`${key}=${updates[key]}`)
    }
  }

  const body = out.join('\n').replace(/\n*$/, '\n')
  const useBanner = bannerIfNew && !existed
  const text = useBanner ? `${bannerIfNew}\n${body}` : body
  writeFileSync(filePath, text, 'utf8')
}

async function exchangeCode({ clientId, clientSecret, redirectUri, code }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error_description || data.error || res.statusText
    throw new Error(`Token exchange failed: ${msg}`)
  }
  if (!data.refresh_token) {
    throw new Error('No refresh_token in response. Try a new code (codes are single-use).')
  }
  return data.refresh_token
}

async function main() {
  process.stdout.write('\nSpotify setup for the “now playing” pill\n')
  process.stdout.write('──────────────────────────────────────────\n\n')

  const clientId = await ask('Spotify Client ID')
  if (!clientId) {
    process.stdout.write('Client ID is required.\n')
    process.exitCode = 1
    return
  }

  const clientSecret = await ask('Spotify Client secret')
  if (!clientSecret) {
    process.stdout.write('Client secret is required.\n')
    process.exitCode = 1
    return
  }

  const redirectUri = await ask('Redirect URI (must match your Spotify app settings)', {
    default: 'http://127.0.0.1:8888/callback',
  })
  if (!redirectUri) {
    process.stdout.write('Redirect URI is required.\n')
    process.exitCode = 1
    return
  }

  let refreshToken = await ask(
    'Existing refresh token (leave empty to open browser flow)',
    { default: '' },
  )

  if (!refreshToken) {
    const authUrl = new URL('https://accounts.spotify.com/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', SCOPES)

    process.stdout.write(
      '\n1. In a SECOND terminal, run:  npm run spotify:callback\n',
    )
    process.stdout.write(
      '   (Listens on :8888 so the browser does not show "connection refused".)\n\n',
    )
    process.stdout.write('2. Add this exact Redirect URI in the Spotify app settings if you have not:\n')
    process.stdout.write(`   ${redirectUri}\n\n`)
    process.stdout.write('3. Open this URL, sign in, and approve:\n\n')
    process.stdout.write(`${authUrl.toString()}\n\n`)
    process.stdout.write(
      '4. Copy the `code` from the browser page or terminal, or paste the full redirect URL here.\n\n',
    )

    const pasted = await ask('Paste the `code` query value (or full URL)', { default: '' })
    let code = pasted.trim()
    if (!code) {
      process.stdout.write('No code. Exiting.\n')
      process.exitCode = 1
      return
    }

    try {
      const u = new URL(code)
      code = u.searchParams.get('code') || code
    } catch {
      /* raw code */
    }

    code = code.replace(/^code=/, '').split('&')[0].trim()

    process.stdout.write('\nExchanging code for tokens…\n')
    refreshToken = await exchangeCode({
      clientId,
      clientSecret,
      redirectUri,
      code,
    })
    process.stdout.write('Got refresh token.\n')
  }

  upsertEnvKeys(
    SERVER_ENV_FILE,
    {
      SPOTIFY_CLIENT_ID: clientId,
      SPOTIFY_CLIENT_SECRET: clientSecret,
      SPOTIFY_REFRESH_TOKEN: refreshToken,
    },
    '# Server-only. Add these in Vercel (or your host) for api/spotify. Do not commit or expose in the browser.',
  )

  process.stdout.write(`\nWrote ${SERVER_ENV_FILE}\n`)
  process.stdout.write('→ Copy those three variables into Vercel → Project → Settings → Environment Variables,\n')
  process.stdout.write('  then redeploy so /api/spotify can read them.\n\n')

  const apiUrl = await ask(
    'Public status URL (your deployed /api/spotify, e.g. https://xxx.vercel.app/api/spotify)',
    { default: '' },
  )

  if (apiUrl) {
    upsertEnvKeys(ENV_FILE, { VITE_SPOTIFY_STATUS_URL: apiUrl })
    process.stdout.write(`\nWrote VITE_SPOTIFY_STATUS_URL to ${ENV_FILE}\n`)
    process.stdout.write('Restart `npm run dev` to load it.\n')
  } else {
    process.stdout.write(
      `\nSkipped .env. When your API is live, add to ${ENV_FILE}:\n  VITE_SPOTIFY_STATUS_URL=https://…/api/spotify\n`,
    )
  }

  process.stdout.write('\nDone.\n')
}

main()
  .catch((err) => {
    console.error(err.message || err)
    process.exitCode = 1
  })
  .finally(() => rl.close())
