import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaCircleExclamation } from 'react-icons/fa6'
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
              <FaCircleExclamation aria-hidden="true" />
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

type HeroAvatarImageProps = {
  displayName: string
  igProxyUrl: string | null
  /** From GET /api/instagram-avatar?username=… (JSON) when ?format=image fails. */
  cdnFromJson: string | null
  staticResolved: string | null
}

/**
 * Try, in order: proxied `format=image` from our API, optional static override, then raw CDN
 * (may work when the image proxy 502s but JSON still returns `profilePicUrl`).
 */
function HeroAvatarImage({
  displayName,
  igProxyUrl,
  cdnFromJson,
  staticResolved,
}: HeroAvatarImageProps) {
  const chain = useMemo(
    () =>
      [igProxyUrl, staticResolved, cdnFromJson]
        .filter((v): v is string => Boolean(v))
        .filter((v, i, a) => a.indexOf(v) === i),
    [igProxyUrl, staticResolved, cdnFromJson],
  )

  const [errIdx, setErrIdx] = useState(0)

  const photoSrc = chain[errIdx] ?? null
  const showPhoto = Boolean(photoSrc)

  const initials =
    displayName.trim().length >= 3
      ? displayName.slice(0, 3).toUpperCase()
      : displayName.trim().toUpperCase().slice(0, 3) || '···'

  return (
    <div
      className={`avatar${showPhoto ? ' avatar--photo' : ''}`}
      {...(showPhoto ? {} : { 'aria-hidden': true })}
    >
      {showPhoto && photoSrc ? (
        <img
          key={`${errIdx}-${photoSrc.slice(0, 64)}`}
          src={photoSrc}
          alt={`${displayName} profile photo`}
          width={320}
          height={320}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrIdx((n) => n + 1)}
        />
      ) : (
        <span>{initials}</span>
      )}
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
        // ignore; hero falls back to initials
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
