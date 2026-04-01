import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaCircleExclamation } from 'react-icons/fa6'
import { instagramUsernameFromProfile, type ProfileConfig } from '../data/profile'

type HeroProps = {
  profile: ProfileConfig
}

function instagramAvatarImageUrl(profile: ProfileConfig): string | null {
  const api = import.meta.env.VITE_INSTAGRAM_AVATAR_URL?.trim()
  const user = instagramUsernameFromProfile(profile)
  if (!api || !user) return null
  const base = api.replace(/\/$/, '')
  return `${base}?username=${encodeURIComponent(user)}&format=image`
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

  const list = aliases?.filter(Boolean) ?? []
  const showTrigger = list.length > 0

  return (
    <h1 className="hero-title">
      <span className="hero-title__cluster">
        <span className="hero-title__text">{heading}</span>
        {showTrigger ? (
          <span className="hero-title__alias-slot">
            <button
              type="button"
              className="hero-title__alias-trigger"
              aria-label="Other names and aliases"
              aria-expanded={open}
              aria-controls="hero-alias-popover"
              onMouseEnter={reveal}
              onMouseLeave={scheduleClose}
            >
              <FaCircleExclamation aria-hidden="true" />
            </button>
            {open ? (
              <span
                id="hero-alias-popover"
                role="tooltip"
                className="hero-title__alias-popover"
                onMouseEnter={reveal}
                onMouseLeave={scheduleClose}
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

function Hero({ profile }: HeroProps) {
  const staticFallback = profile.avatarSrc?.trim() || null
  const igProxyUrl = useMemo(() => instagramAvatarImageUrl(profile), [profile])

  const [igBroken, setIgBroken] = useState(false)

  useEffect(() => {
    setIgBroken(false)
  }, [igProxyUrl])

  const photoSrc =
    igProxyUrl && !igBroken ? igProxyUrl : staticFallback || null
  const showPhoto = Boolean(photoSrc)

  const initials =
    profile.displayName.trim().length >= 3
      ? profile.displayName.slice(0, 3).toUpperCase()
      : profile.displayName.trim().toUpperCase().slice(0, 3) || '···'

  return (
    <div className="hero hero--links">
      <div
        className={`avatar${showPhoto ? ' avatar--photo' : ''}`}
        {...(showPhoto ? {} : { 'aria-hidden': true })}
      >
        {showPhoto && photoSrc ? (
          <img
            src={photoSrc}
            alt={`${profile.displayName} profile photo`}
            width={320}
            height={320}
            decoding="async"
            {...(igProxyUrl && photoSrc === igProxyUrl
              ? { onError: () => setIgBroken(true) }
              : {})}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
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
