export type SocialLinkStatus = 'active' | 'coming_soon'

export type SocialLink = {
  id: 'instagram' | 'spotify' | 'youtube'
  label: string
  handle?: string
  url?: string
  status: SocialLinkStatus
  primary?: boolean
}

export type ProfileConfig = {
  /** Public name (hero, footer, etc.). */
  displayName: string
  /** Optional other names / handles shown in the hero alias popover. */
  aliases?: string[]
  /**
   * Instagram login for the hero avatar API (e.g. `itsasheruwu`). Preferred over
   * parsing `links` so the picture always matches your IG regardless of URL params.
   */
  instagramUsername?: string
  /**
   * Optional static avatar (e.g. `${import.meta.env.BASE_URL}avatar.png`) used if
   * Instagram URL is unavailable or `VITE_INSTAGRAM_AVATAR_URL` is not set.
   */
  avatarSrc?: string
  tagline?: string
  /** Short line shown under the tagline in a pull-quote style. */
  quote?: string
  email: string
  links: SocialLink[]
}

/** Instagram login: explicit `instagramUsername`, else path from the Instagram link. */
export function instagramUsernameFromProfile(p: ProfileConfig): string | null {
  const explicit = p.instagramUsername?.trim()
  if (explicit) return explicit

  const ig = p.links.find((l) => l.id === 'instagram' && l.url)
  if (!ig?.url) return null
  try {
    const seg = new URL(ig.url).pathname.replace(/^\/+|\/+$/g, '').split('/')[0]
    if (!seg || seg === 'p' || seg === 'reel' || seg === 'reels' || seg === 'stories') {
      return null
    }
    return seg
  } catch {
    return null
  }
}

export const profile: ProfileConfig = {
  displayName: 'Ash',
  aliases: ['cal'],
  instagramUsername: 'itsasheruwu',
  tagline: 'Most active on Instagram.',
  quote: 'If I only knew then, what i know now',
  email: 's956t2hpg9@privaterelay.appleid.com',
  links: [
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@itsasheruwu',
      url: 'https://www.instagram.com/itsasheruwu?igsh=MTJ2cDIwZDh2bjltbw%3D%3D&utm_source=qr',
      status: 'active',
      primary: true,
    },
    {
      id: 'spotify',
      label: 'Spotify',
      handle: '@ash',
      url: 'https://open.spotify.com/user/316plljirvcpala37jqitv2fhese?si=512c3823d07749a2',
      status: 'active',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      status: 'coming_soon',
    },
  ],
}
