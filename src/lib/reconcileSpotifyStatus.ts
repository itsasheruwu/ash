export type SpotifyTrack = {
  name: string
  artist: string
  url: string | null
  album?: string | null
  albumUrl?: string | null
  image?: string | null
  durationMs?: number | null
  released?: string | null
  trackNumber?: number | null
  discNumber?: number | null
  albumTotalTracks?: number | null
  explicit?: boolean | null
}

export type SpotifyStatusPayload =
  | {
      ok: true
      state: 'playing' | 'paused' | 'recent' | 'idle'
      track: SpotifyTrack | null
      progressMs?: number | null
      fetchedAt?: number | null
    }
  | { ok: false; error?: string }

/** How long to keep showing playing/paused when Spotify briefly 204s into recently-played. */
export const SPOTIFY_DEMOTE_HOLD_MS = 10_000

/**
 * Avoid flashing “Last played” when `currently-playing` returns empty for a moment
 * (between tracks / API blips) while we still have a live playing/paused payload.
 */
export function reconcileSpotifyStatus(
  prev: SpotifyStatusPayload | null,
  next: SpotifyStatusPayload,
  nowMs: number,
  demoteSince: number | null,
): { data: SpotifyStatusPayload; demoteSince: number | null } {
  const prevLive =
    prev?.ok === true &&
    (prev.state === 'playing' || prev.state === 'paused') &&
    Boolean(prev.track)

  const nextDemoted =
    !next.ok || (next.ok && (next.state === 'recent' || next.state === 'idle'))

  if (prevLive && nextDemoted && prev) {
    const since = demoteSince ?? nowMs
    if (nowMs - since < SPOTIFY_DEMOTE_HOLD_MS) {
      return { data: prev, demoteSince: since }
    }
    return { data: next, demoteSince: null }
  }

  if (next.ok && (next.state === 'playing' || next.state === 'paused')) {
    return { data: next, demoteSince: null }
  }

  return { data: next, demoteSince: null }
}
