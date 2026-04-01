#!/usr/bin/env node
/**
 * Serves http://127.0.0.1:8888/callback so Spotify's redirect succeeds.
 * Run this BEFORE opening the authorize URL, in a separate terminal:
 *   npm run spotify:callback
 */

import http from 'node:http'
import process from 'node:process'

const port = 8888
const host = '127.0.0.1'

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`)
  const code = url.searchParams.get('code')
  const err = url.searchParams.get('error')

  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (err) {
    const desc = url.searchParams.get('error_description') || ''
    res.statusCode = 400
    res.end(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;background:#111;color:#eee">
      <h1>Spotify returned an error</h1><p><strong>${err}</strong></p><p>${desc}</p>
      </body></html>`,
    )
    process.stderr.write(`\nOAuth error: ${err} — ${desc}\n`)
    return
  }

  if (code) {
    res.end(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;background:#111;color:#eee;max-width:42rem">
      <h1 style="color:#1ed760">Authorized</h1>
      <p>Copy the code below into <code>npm run setup:spotify</code> when it asks for the code:</p>
      <pre style="background:#222;padding:1rem;border-radius:8px;word-break:break-all;user-select:all">${code}</pre>
      <p style="color:#888;font-size:0.9rem">You can close this tab. The same code is printed in the terminal.</p>
      </body></html>`)
    process.stdout.write('\n──────── Code (paste into setup-spotify) ────────\n')
    process.stdout.write(code)
    process.stdout.write('\n──────────────────────────────────────────────────\n\n')
    return
  }

  res.statusCode = 404
  res.end(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
    <p>Open the Spotify authorize link. This server only handles <code>/callback?code=…</code>.</p>
    </body></html>`,
  )
})

server.listen(port, host, () => {
  process.stdout.write(`
Spotify callback server listening:
  http://${host}:${port}/callback

1. Leave this terminal open.
2. In other terminal: npm run setup:spotify  (or open your Spotify authorize URL in the browser)
3. After you approve, this page will show your code.

`)
})

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    process.stderr.write(
      `Port ${port} is already in use. Stop the other process or change the port in this script.\n`,
    )
  } else {
    process.stderr.write(String(e) + '\n')
  }
  process.exit(1)
})
