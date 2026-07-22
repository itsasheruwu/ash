import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaCircleInfo } from 'react-icons/fa6'
import {
  getInstagramApiBase,
  getInstagramProxyImageUrl,
} from '@/lib/instagramAvatarApi'
import { instagramUsernameFromProfile, type ProfileConfig } from '../data/profile'

type HeroProps = {
  profile: ProfileConfig
}

function publicAssetUrl(relativePath: string): string {
  const p = relativePath.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${p}`
}

function HeroTitle({
  heading,
  aliases,
}: {
  heading: string
  aliases?: string[]
}) {
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const [open, setOpen] = useState(false)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }, [cancelClose])

  const reveal = useCallback(() => {
    cancelClose()
    setOpen(true)
  }, [cancelClose])

  useEffect(() => () => cancelClose(), [cancelClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const list = aliases?.filter(Boolean) ?? []
  const showTrigger = list.length > 0

  return (
    <h1 className="hero-title">
      <span className="hero-title__cluster">
        <span className="hero-title__text">{heading}</span>
        {showTrigger ? (
          <span
            className="hero-title__alias-slot"
            onMouseEnter={reveal}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className="hero-title__alias-trigger"
              aria-label="Other names and aliases"
              aria-expanded={open}
              aria-controls="hero-alias-popover"
              onFocus={reveal}
              onBlur={scheduleClose}
            >
              <FaCircleInfo aria-hidden="true" />
            </button>
            {open ? (
              <span
                id="hero-alias-popover"
                role="tooltip"
                className="hero-title__alias-popover"
              >
                <span className="hero-title__alias-popover-label">Aliases</span>
                <ul className="hero-title__alias-list">
                  {list.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </h1>
  )
}

type LiveAvatarLayerProps = {
  src: string
  alt: string
  /** When true, live image is decorative over an already-labeled static base. */
  decorative: boolean
  onError: () => void
  onReady: () => void
}

/**
 * Remount via `key` when `src` changes so `ready` resets without an effect.
 * Soft-fades in once the live image loads successfully.
 */
function LiveAvatarLayer({
  src,
  alt,
  decorative,
  onError,
  onReady,
}: LiveAvatarLayerProps) {
  const [ready, setReady] = useState(false)

  return (
    <img
      className={`avatar__img avatar__img--live${ready ? ' is-ready' : ''}`}
      src={src}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? true : undefined}
      width={320}
      height={320}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => {
        setReady(true)
        onReady()
      }}
      onError={onError}
    />
  )
}

type HeroAvatarImageProps = {
  displayName: string
  igProxyUrl: string | null
  /** From GET /api/instagram-avatar?username=… (JSON) when ?format=image fails. */
  cdnFromJson: string | null
  staticResolved: string | null
}

/**
 * Display static local avatar first (no initials flash), then soft-crossfade to a
 * live proxy/CDN image when it loads. Fallback probe order remains proxy → CDN;
 * static stays as the visible base if live sources fail.
 */
function HeroAvatarImage({
  displayName,
  igProxyUrl,
  cdnFromJson,
  staticResolved,
}: HeroAvatarImageProps) {
  const liveChain = useMemo(
    () =>
      [igProxyUrl, cdnFromJson]
        .filter((v): v is string => Boolean(v))
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter((v) => v !== staticResolved),
    [igProxyUrl, cdnFromJson, staticResolved],
  )

  const [errIdx, setErrIdx] = useState(0)
  /** Only treat live as ready when it matches the current probe src (avoids stale ready across retries). */
  const [readyLiveSrc, setReadyLiveSrc] = useState<string | null>(null)

  const liveSrc = liveChain[errIdx] ?? null
  const liveReady = Boolean(liveSrc && readyLiveSrc === liveSrc)
  const hasStatic = Boolean(staticResolved)
  const photoAlt = `${displayName} profile photo`
  const showPhoto = hasStatic || Boolean(liveSrc)
  const showInitials = !hasStatic && !liveReady

  const initials =
    displayName.trim().length >= 3
      ? displayName.slice(0, 3).toUpperCase()
      : displayName.trim().toUpperCase().slice(0, 3) || '···'

  return (
    <div
      className={`avatar${showPhoto ? ' avatar--photo' : ''}`}
      {...(!showPhoto ? { 'aria-hidden': true } : {})}
    >
      {hasStatic && staticResolved ? (
        <img
          className="avatar__img avatar__img--base"
          src={staticResolved}
          alt={photoAlt}
          width={320}
          height={320}
          decoding="async"
          fetchPriority="high"
        />
      ) : null}
      {liveSrc ? (
        <LiveAvatarLayer
          key={`${errIdx}-${liveSrc.slice(0, 64)}`}
          src={liveSrc}
          alt={photoAlt}
          decorative={hasStatic}
          onReady={() => setReadyLiveSrc(liveSrc)}
          onError={() => {
            setReadyLiveSrc(null)
            setErrIdx((n) => n + 1)
          }}
        />
      ) : null}
      {showInitials ? <span className="avatar__initials">{initials}</span> : null}
    </div>
  )
}

type HeroAvatarSectionProps = {
  displayName: string
  staticResolved: string | null
  igProxyUrl: string | null
  apiBase: string | null
  igName: string | null
}

/** Fetches JSON profilePic; parent uses `key` so cdn state resets on API identity change. */
function HeroAvatarSection({
  displayName,
  staticResolved,
  igProxyUrl,
  apiBase,
  igName,
}: HeroAvatarSectionProps) {
  const [cdnFromJson, setCdnFromJson] = useState<string | null>(null)

  useEffect(() => {
    if (!apiBase || !igName) return
    const ac = new AbortController()
    const url = `${apiBase.replace(/\/$/, '')}?username=${encodeURIComponent(igName)}`
    void fetch(url, { signal: ac.signal, credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ok?: boolean; profilePicUrl?: string } | null) => {
        if (j?.ok && typeof j.profilePicUrl === 'string' && /^https?:/i.test(j.profilePicUrl)) {
          setCdnFromJson(j.profilePicUrl)
        }
      })
      .catch(() => {
        // ignore; hero falls back to static / initials
      })
    return () => ac.abort()
  }, [apiBase, igName])

  return (
    <HeroAvatarImage
      displayName={displayName}
      igProxyUrl={igProxyUrl}
      cdnFromJson={cdnFromJson}
      staticResolved={staticResolved}
    />
  )
}

function Hero({ profile }: HeroProps) {
  const staticResolved = useMemo(() => {
    const raw = profile.avatarSrc?.trim()
    if (!raw) return null
    if (/^https?:\/\//i.test(raw)) return raw
    return publicAssetUrl(raw)
  }, [profile.avatarSrc])

  const apiBase = useMemo(() => getInstagramApiBase(profile), [profile])
  const igName = useMemo(() => instagramUsernameFromProfile(profile), [profile])
  const sourceKey = useMemo(
    () => `${apiBase ?? '∅'}:${igName ?? '∅'}`,
    [apiBase, igName],
  )

  const igProxyUrl = useMemo(() => getInstagramProxyImageUrl(profile), [profile])

  return (
    <div className="hero">
      <HeroAvatarSection
        key={sourceKey}
        displayName={profile.displayName}
        staticResolved={staticResolved}
        igProxyUrl={igProxyUrl}
        apiBase={apiBase}
        igName={igName}
      />
      <div className="hero-copy">
        <HeroTitle heading={profile.displayName} aliases={profile.aliases} />
        {profile.tagline ? <p className="tagline hero-tagline">{profile.tagline}</p> : null}
        {profile.quote ? (
          <figure className="hero-quote">
            <span className="hero-quote__rule" aria-hidden="true" />
            <blockquote className="hero-quote__body">
              <p className="hero-quote__text">{profile.quote}</p>
            </blockquote>
          </figure>
        ) : null}
      </div>
    </div>
  )
}

export default Hero
