import { instagramUsernameFromProfile, type ProfileConfig } from '../data/profile'

/** Same host as SpotifyStatusPill’s production fallback when env/secrets are unset. */
const DEFAULT_INSTAGRAM_AVATAR_URL =
  'https://ash-chi-nine.vercel.app/api/instagram-avatar'

/**
 * Resolves the root URL for `GET /api/instagram-avatar` (no `?` query), using the same
 * precedence as the hero: env, profile, Spotify-host inference, then local dev only.
 */
export function getInstagramApiBase(profile: ProfileConfig): string | null {
  const direct = import.meta.env.VITE_INSTAGRAM_AVATAR_URL?.trim()
  if (direct) {
    return direct.split('?')[0]!.replace(/\/$/, '')
  }

  const fromProfile = profile.instagramAvatarApiBase?.trim()
  if (fromProfile) {
    return fromProfile.split('?')[0]!.replace(/\/$/, '')
  }

  const spotify = import.meta.env.VITE_SPOTIFY_STATUS_URL?.trim()
  if (spotify) {
    const abs = resolvePossiblyRelativeUrl(spotify)
    if (abs) {
      try {
        const u = new URL(abs)
        const path = u.pathname.replace(/\/$/, '') || u.pathname
        if (path.endsWith('/api/spotify')) {
          u.pathname = path.replace(/\/api\/spotify$/, '/api/instagram-avatar')
          u.search = ''
          u.hash = ''
          return u.toString().replace(/\/$/, '')
        }
      } catch {
        // ignore
      }
    }
  }

  if (import.meta.env.DEV && import.meta.env.MODE !== 'test' && typeof window !== 'undefined') {
    return `${window.location.origin}/api/instagram-avatar`
  }

  // GitHub Pages production when Actions secrets were never set (mirrors Spotify default).
  if (import.meta.env.PROD) {
    return DEFAULT_INSTAGRAM_AVATAR_URL
  }

  return null
}

function resolvePossiblyRelativeUrl(s: string): string | null {
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (typeof window === 'undefined') return null
  try {
    return new URL(s, window.location.origin).href
  } catch {
    return null
  }
}

/**
 * `GET` URL that returns the proxied image bytes (preferred for &lt;img src&gt;).
 */
export function getInstagramProxyImageUrl(profile: ProfileConfig): string | null {
  const user = instagramUsernameFromProfile(profile)
  if (!user) return null
  const base = getInstagramApiBase(profile)
  if (!base) return null
  return `${base.replace(/\/$/, '')}?username=${encodeURIComponent(user)}&format=image`
}
