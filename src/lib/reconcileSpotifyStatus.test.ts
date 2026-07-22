import { describe, expect, it } from 'vitest'
import {
  reconcileSpotifyStatus,
  SPOTIFY_DEMOTE_HOLD_MS,
  type SpotifyStatusPayload,
} from './reconcileSpotifyStatus'

const playing: SpotifyStatusPayload = {
  ok: true,
  state: 'playing',
  track: {
    name: 'Song A',
    artist: 'Artist',
    url: 'https://open.spotify.com/track/a',
    durationMs: 180_000,
  },
  progressMs: 60_000,
  fetchedAt: 1_000,
}

const recentSame: SpotifyStatusPayload = {
  ok: true,
  state: 'recent',
  track: {
    name: 'Song A',
    artist: 'Artist',
    url: 'https://open.spotify.com/track/a',
  },
  progressMs: null,
  fetchedAt: 2_000,
}

const playingB: SpotifyStatusPayload = {
  ok: true,
  state: 'playing',
  track: {
    name: 'Song B',
    artist: 'Artist',
    url: 'https://open.spotify.com/track/b',
    durationMs: 200_000,
  },
  progressMs: 1_000,
  fetchedAt: 3_000,
}

describe('reconcileSpotifyStatus', () => {
  it('holds playing across a brief recent demotion', () => {
    const first = reconcileSpotifyStatus(playing, recentSame, 5_000, null)
    expect(first.data).toEqual(playing)
    expect(first.demoteSince).toBe(5_000)

    const second = reconcileSpotifyStatus(
      first.data,
      recentSame,
      5_000 + SPOTIFY_DEMOTE_HOLD_MS - 1,
      first.demoteSince,
    )
    expect(second.data).toEqual(playing)
  })

  it('accepts recent after the hold window', () => {
    const held = reconcileSpotifyStatus(playing, recentSame, 5_000, null)
    const done = reconcileSpotifyStatus(
      held.data,
      recentSame,
      5_000 + SPOTIFY_DEMOTE_HOLD_MS,
      held.demoteSince,
    )
    expect(done.data).toEqual(recentSame)
    expect(done.demoteSince).toBeNull()
  })

  it('clears the hold when playback resumes', () => {
    const held = reconcileSpotifyStatus(playing, recentSame, 5_000, null)
    const resumed = reconcileSpotifyStatus(
      held.data,
      playingB,
      6_000,
      held.demoteSince,
    )
    expect(resumed.data).toEqual(playingB)
    expect(resumed.demoteSince).toBeNull()
  })

  it('holds through a transient network error while live', () => {
    const err: SpotifyStatusPayload = { ok: false, error: 'network' }
    const held = reconcileSpotifyStatus(playing, err, 5_000, null)
    expect(held.data).toEqual(playing)
  })
})
