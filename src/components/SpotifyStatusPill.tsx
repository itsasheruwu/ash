import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { FaChevronDown, FaSpotify } from 'react-icons/fa6'

const POLL_MS = 45_000

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
  | { ok: true; state: 'playing' | 'paused' | 'recent' | 'idle'; track: Track | null }
  | { ok: false; error?: string }

function cx(...parts: (string | undefined | null | false)[]) {
  return parts.filter((p): p is string => typeof p === 'string' && p !== '').join(' ')
}

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

type SpotifyStatusPillProps = {
  className?: string
}

function SpotifyStatusPill({ className }: SpotifyStatusPillProps) {
  const endpoint = import.meta.env.VITE_SPOTIFY_STATUS_URL
  const outerRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(Boolean(endpoint))
  const [expanded, setExpanded] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!endpoint) return

    try {
      const res = await fetch(endpoint, { credentials: 'omit' })
      const json = (await res.json()) as StatusPayload
      setData(json)
    } catch {
      setData({ ok: false, error: 'network' })
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    if (!endpoint) return

    void fetchStatus()
    const id = window.setInterval(() => void fetchStatus(), POLL_MS)
    return () => window.clearInterval(id)
  }, [endpoint, fetchStatus])

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
    <div ref={outerRef} className={cx('spotify-status-pill-outer', className)}>
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

  if (!track) {
    return outer(
      <div className="spotify-status-pill spotify-status-pill--idle" role="status">
        <FaSpotify className="spotify-status-pill__brand" aria-hidden="true" />
        <span className="spotify-status-pill__text">Nothing playing lately</span>
      </div>,
    )
  }

  const label =
    state === 'playing'
      ? `Now playing: ${track.name} — ${track.artist}`
      : state === 'paused'
        ? `Paused: ${track.name} — ${track.artist}`
        : `Last played: ${track.name} — ${track.artist}`

  const innerCore = (
    <>
      <FaSpotify className="spotify-status-pill__brand" aria-hidden="true" />
      <span
        className={`spotify-status-pill__dot${state === 'playing' ? ' spotify-status-pill__dot--live' : ''}`}
        aria-hidden="true"
      />
      <span className="spotify-status-pill__copy">
        <span className="spotify-status-pill__line1">
          <span className="spotify-status-pill__title">{track.name}</span>
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
        className={cx(
          'spotify-status-pill-outer',
          className,
          expanded && 'spotify-status-pill-outer--expanded',
        )}
      >
        <div
          className={cx(
            'spotify-morph',
            expanded && 'spotify-morph--expanded',
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
              className={cx('spotify-morph__chev', expanded && 'spotify-morph__chev--open')}
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
                  className={cx(
                    'spotify-morph__detail',
                    !track.image && 'spotify-morph__detail--no-art',
                  )}
                >
                  <div className="spotify-morph__meta">
                    <p className="spotify-morph__state-badge">
                      {state === 'playing'
                        ? 'Now playing'
                        : state === 'paused'
                          ? 'Paused'
                          : 'Last played'}
                    </p>
                    <h2 className="spotify-morph__track-name">
                      {track.name}
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
      className={cx('spotify-status-pill', `spotify-status-pill--${state}`)}
      role="status"
      aria-label={label}
    >
      {innerCore}
    </div>,
  )
}

export default SpotifyStatusPill
