import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { FaChevronDown, FaSpotify } from 'react-icons/fa6'

import { extractVibrantColorsFromImageUrl, padStopsToFourColors } from '@/lib/extractVibrantColorsFromImageUrl'
import { cn } from '@/lib/utils'

const POLL_MS = 5_000
const TRANSITION_POLL_MS = 1_500
const TRANSITION_WINDOW_MS = 12_000
const DEFAULT_SPOTIFY_STATUS_URL = 'https://ash-chi-nine.vercel.app/api/spotify'

type Track = {
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

type StatusPayload =
  | {
      ok: true
      state: 'playing' | 'paused' | 'recent' | 'idle'
      track: Track | null
      progressMs?: number | null
      fetchedAt?: number | null
    }
  | { ok: false; error?: string }

function formatDuration(ms: number | null | undefined) {
  if (ms == null || ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function releaseLabel(iso: string | null | undefined) {
  if (!iso) return null
  const y = iso.slice(0, 4)
  return /^\d{4}$/.test(y) ? y : iso
}

function displayTrackTitle(name: string) {
  return name
    .replace(/\s*[\[(]\s*(?:feat\.?|ft\.?|featuring)\s+[^)\]]+[\])]\s*$/i, '')
    .trim() || name
}

function withCacheBust(endpoint: string) {
  try {
    const u = new URL(endpoint, window.location.origin)
    u.searchParams.set('_', Date.now().toString())
    return u.toString()
  } catch {
    const sep = endpoint.includes('?') ? '&' : '?'
    return `${endpoint}${sep}_=${Date.now()}`
  }
}

function estimatedRemainingMs(data: StatusPayload | null, nowMs: number) {
  if (!data?.ok || data.state !== 'playing' || !data.track?.durationMs) return null
  if (typeof data.progressMs !== 'number') return null
  const fetchedAt = typeof data.fetchedAt === 'number' ? data.fetchedAt : nowMs
  const elapsed = Math.max(0, nowMs - fetchedAt)
  const estimatedProgress = Math.min(data.track.durationMs, data.progressMs + elapsed)
  return Math.max(0, data.track.durationMs - estimatedProgress)
}

type SpotifyStatusPillProps = {
  className?: string
}

function SpotifyStatusPill({ className }: SpotifyStatusPillProps) {
  const endpoint = import.meta.env.VITE_SPOTIFY_STATUS_URL || DEFAULT_SPOTIFY_STATUS_URL
  const outerRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(Boolean(endpoint))
  const [expanded, setExpanded] = useState(false)
  const [titleArtStops, setTitleArtStops] = useState<CSSProperties | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const fetchStatus = useCallback(
    async (signal: AbortSignal) => {
      if (!endpoint) return

      try {
        const res = await fetch(withCacheBust(endpoint), {
          cache: 'no-store',
          credentials: 'omit',
          signal,
        })
        if (!res.ok) {
          setData({ ok: false, error: `http_${res.status}` })
          return
        }
        const ct = res.headers.get('content-type')
        if (ct && !ct.includes('application/json')) {
          setData({ ok: false, error: 'bad_content_type' })
          return
        }
        const json = (await res.json()) as StatusPayload
        setData(json)
      } catch (e) {
        if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') {
          return
        }
        setData({ ok: false, error: 'network' })
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    },
    [endpoint],
  )

  useEffect(() => {
    if (!endpoint) return

    const ac = new AbortController()
    void fetchStatus(ac.signal)
    const id = window.setInterval(() => {
      void fetchStatus(ac.signal)
    }, POLL_MS)
    return () => {
      ac.abort()
      window.clearInterval(id)
    }
  }, [endpoint, fetchStatus])

  const remainingMs = estimatedRemainingMs(data, nowMs)
  const isTransitioning =
    data?.ok === true &&
    data.state === 'playing' &&
    remainingMs != null &&
    remainingMs <= TRANSITION_WINDOW_MS

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!endpoint || !isTransitioning) return
    const ac = new AbortController()
    const id = window.setInterval(() => {
      void fetchStatus(ac.signal)
    }, TRANSITION_POLL_MS)
    return () => {
      ac.abort()
      window.clearInterval(id)
    }
  }, [endpoint, fetchStatus, isTransitioning])

  const trackImageUrlForArt = (() => {
    if (!data?.ok || !data.track) return null
    const u = data.track.image?.trim()
    if (!u || !/^https:\/\//i.test(u)) return null
    return u
  })()

  useEffect(() => {
    if (!trackImageUrlForArt) {
      setTitleArtStops(null)
      return
    }
    const ac = new AbortController()
    let cancelled = false
    setTitleArtStops(null)
    void extractVibrantColorsFromImageUrl(trackImageUrlForArt, ac.signal)
      .then((colors) => {
        if (cancelled || ac.signal.aborted) return
        if (!colors || colors.length < 2) {
          setTitleArtStops(null)
          return
        }
        const [c0, c1, c2, c3] = padStopsToFourColors(colors)
        setTitleArtStops({
          '--spotify-title-art-0': c0,
          '--spotify-title-art-1': c1,
          '--spotify-title-art-2': c2,
          '--spotify-title-art-3': c3,
        } as CSSProperties)
      })
      .catch(() => {
        if (!cancelled) setTitleArtStops(null)
      })
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [trackImageUrlForArt])

  useEffect(() => {
    if (!expanded) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const el = outerRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setExpanded(false)
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [expanded])

  const outer = (node: ReactNode) => (
    <div ref={outerRef} className={cn('spotify-status-pill-outer', className)}>
      {node}
    </div>
  )

  if (!endpoint) {
    return null
  }

  if (loading || data === null) {
    return outer(
      <div className="spotify-status-pill spotify-status-pill--loading" aria-busy="true">
        <FaSpotify className="spotify-status-pill__brand" aria-hidden="true" />
        <span className="spotify-status-pill__text">Loading Spotify…</span>
      </div>,
    )
  }

  if (!data.ok) {
    return outer(
      <div className="spotify-status-pill spotify-status-pill--error" role="status">
        <FaSpotify className="spotify-status-pill__brand" aria-hidden="true" />
        <span className="spotify-status-pill__text">Spotify unavailable</span>
      </div>,
    )
  }

  const { state, track } = data
  const trackTitle = displayTrackTitle(track.name)

  if (!track) {
    return outer(
      <div className="spotify-status-pill spotify-status-pill--idle" role="status">
        <FaSpotify className="spotify-status-pill__brand" aria-hidden="true" />
        <span className="spotify-status-pill__text">Nothing playing lately</span>
      </div>,
    )
  }

  const label =
    isTransitioning
      ? `Transitioning soon: ${trackTitle} — ${track.artist}`
      : state === 'playing'
        ? `Now playing: ${trackTitle} — ${track.artist}`
      : state === 'paused'
        ? `Paused: ${trackTitle} — ${track.artist}`
        : `Last played: ${trackTitle} — ${track.artist}`

  const titleClassName = cn(
    'spotify-status-pill__title',
    titleArtStops && 'spotify-status-pill__title--art-gradient',
  )

  const innerCore = (
    <>
      <FaSpotify className="spotify-status-pill__brand" aria-hidden="true" />
      <span
        className={`spotify-status-pill__dot${state === 'playing' ? ' spotify-status-pill__dot--live' : ''}`}
        aria-hidden="true"
      />
      <span className="spotify-status-pill__copy">
        <span className="spotify-status-pill__line1">
          <span className={titleClassName} style={titleArtStops ?? undefined}>
            {trackTitle}
          </span>
        </span>
        {track.artist ? (
          <span className="spotify-status-pill__artist">{track.artist}</span>
        ) : null}
      </span>
    </>
  )

  const durationStr = formatDuration(track.durationMs ?? null)
  const yearStr = releaseLabel(track.released ?? null)
  const panelId = 'spotify-track-detail-panel'

  if (track.url) {
    return (
      <div
        ref={outerRef}
        className={cn(
          'spotify-status-pill-outer',
          className,
          expanded && 'spotify-status-pill-outer--expanded',
        )}
      >
        <div
          className={cn(
            'spotify-morph',
            expanded && 'spotify-morph--expanded',
            isTransitioning && 'spotify-morph--transitioning',
            `spotify-morph--${state}`,
          )}
        >
          <button
            type="button"
            className="spotify-morph__header"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${label}. ${expanded ? 'Collapse' : 'Expand'} details.`}
            onClick={() => setExpanded((e) => !e)}
          >
            {innerCore}
            <FaChevronDown
              className={cn('spotify-morph__chev', expanded && 'spotify-morph__chev--open')}
              aria-hidden="true"
            />
          </button>

          <div className="spotify-morph__grow">
            <div className="spotify-morph__grow-inner">
              <div
                id={panelId}
                className="spotify-morph__body"
                role="region"
                aria-label="Track details"
                aria-hidden={!expanded}
              >
                <div
                  className={cn(
                    'spotify-morph__detail',
                    !track.image && 'spotify-morph__detail--no-art',
                  )}
                >
                  <div className="spotify-morph__meta">
                    <p className="spotify-morph__state-badge">
                      {state === 'playing'
                        ? isTransitioning
                          ? 'Transitioning'
                          : 'Now playing'
                        : state === 'paused'
                          ? 'Paused'
                          : 'Last played'}
                    </p>
                    <h2 className="spotify-morph__track-name">
                      {trackTitle}
                      {track.explicit ? (
                        <span className="spotify-morph__explicit" aria-label="Explicit">
                          E
                        </span>
                      ) : null}
                    </h2>
                    <p className="spotify-morph__artist-line">{track.artist}</p>
                    {track.album ? (
                      <div className="spotify-morph__album-block">
                        <span className="spotify-morph__album-label">Album</span>
                        {track.albumUrl ? (
                          <a
                            className="spotify-morph__album-link"
                            href={track.albumUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            tabIndex={expanded ? 0 : -1}
                          >
                            {track.album}
                            <span className="visually-hidden">
                              {' '}
                              (opens album in new tab)
                            </span>
                          </a>
                        ) : (
                          <span className="spotify-morph__album-name">{track.album}</span>
                        )}
                      </div>
                    ) : null}
                    <dl className="spotify-morph__facts">
                      {durationStr ? (
                        <>
                          <dt>Duration</dt>
                          <dd>{durationStr}</dd>
                        </>
                      ) : null}
                      {yearStr ? (
                        <>
                          <dt>Released</dt>
                          <dd>{yearStr}</dd>
                        </>
                      ) : null}
                      {track.trackNumber != null ? (
                        <>
                          <dt>Track</dt>
                          <dd>
                            {track.discNumber != null && track.discNumber > 1
                              ? `Disc ${track.discNumber}, track `
                              : ''}
                            {track.trackNumber}
                            {track.albumTotalTracks != null
                              ? ` of ${track.albumTotalTracks}`
                              : ''}
                          </dd>
                        </>
                      ) : null}
                    </dl>
                  </div>
                  {track.image ? (
                    <div className="spotify-morph__art-wrap">
                      <img
                        className="spotify-morph__art"
                        src={track.image}
                        alt=""
                        width={128}
                        height={128}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : null}
                </div>
                <a
                  className="spotify-morph__open"
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={expanded ? 0 : -1}
                >
                  <FaSpotify aria-hidden="true" />
                  Open in Spotify
                  <span className="visually-hidden">(opens in new tab)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return outer(
    <div
      className={cn('spotify-status-pill', `spotify-status-pill--${state}`)}
      role="status"
      aria-label={label}
    >
      {innerCore}
    </div>,
  )
}

export default SpotifyStatusPill
