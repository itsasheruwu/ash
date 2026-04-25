/**
 * Vercel Serverless: GET /api/spotify
 *
 * Env (set in Vercel project settings, never in the client):
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *   SPOTIFY_REFRESH_TOKEN
 *
 * Returns JSON for the static site to poll. CORS: open (*).
 */

function pickAlbumImage(images) {
  if (!images?.length) return null
  const sorted = [...images].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0),
  )
  return sorted[0]?.url ?? null
}

function displayTrackTitle(name) {
  if (typeof name !== 'string') return name
  return (
    name
      .replace(/\s*[\[(]\s*(?:feat\.?|ft\.?|featuring)\s+[^)\]]+[\])]/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || name
  )
}

function formatTrack(item) {
  if (!item?.name) return null
  const artist =
    item.artists?.map((a) => a.name).filter(Boolean).join(', ') ?? ''
  const album = item.album
  const image = pickAlbumImage(album?.images)
  return {
    name: displayTrackTitle(item.name),
    artist,
    url: item.external_urls?.spotify ?? null,
    album: album?.name ?? null,
    albumUrl: album?.external_urls?.spotify ?? null,
    image,
    durationMs:
      typeof item.duration_ms === 'number' ? item.duration_ms : null,
    released: album?.release_date ?? null,
    trackNumber:
      typeof item.track_number === 'number' ? item.track_number : null,
    discNumber:
      typeof item.disc_number === 'number' ? item.disc_number : null,
    albumTotalTracks:
      typeof album?.total_tracks === 'number' ? album.total_tracks : null,
    explicit: Boolean(item.explicit),
  }
}

function cacheControl(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  cacheControl(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    res.status(200).json({ ok: false, error: 'server_misconfigured' })
    return
  }

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => '')
      console.error('Spotify token refresh failed', tokenRes.status, errText)
      res.status(200).json({ ok: false, error: 'token_refresh_failed' })
      return
    }

    const tokenPayload = await tokenRes.json()
    const accessToken = tokenPayload.access_token

    const currentRes = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (currentRes.status === 200) {
      const body = await currentRes.json()
      const item = body.item
      const track = formatTrack(item)
      if (track) {
        res.status(200).json({
          ok: true,
          state: body.is_playing ? 'playing' : 'paused',
          track,
          progressMs:
            typeof body.progress_ms === 'number' ? body.progress_ms : null,
          fetchedAt: Date.now(),
        })
        return
      }
    }

    const recentRes = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )

    if (!recentRes.ok) {
      res.status(200).json({ ok: true, state: 'idle', track: null })
      return
    }

    const recentPayload = await recentRes.json()
    const last = recentPayload.items?.[0]?.track
    const track = formatTrack(last)

    res.status(200).json({
      ok: true,
      state: track ? 'recent' : 'idle',
      track,
      progressMs: null,
      fetchedAt: Date.now(),
    })
  } catch (e) {
    console.error('spotify handler error', e)
    res.status(200).json({ ok: false, error: 'upstream_error' })
  }
}
