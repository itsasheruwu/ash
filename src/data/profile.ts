export type SocialLinkStatus = 'active' | 'coming_soon'

export type SocialLink = {
  id: 'instagram' | 'spotify' | 'discord' | 'apple_music' | 'youtube'
  label: string
  handle?: string
  url?: string
  artistUrl?: string
  status: SocialLinkStatus
  primary?: boolean
}

export type ProfileConfig = {
  displayName: string
  aliases?: string[]
  instagramUsername?: string
  /**
   * Full URL to your deployed `GET /api/instagram-avatar` (e.g. Vercel from `api/instagram-avatar.js`).
   * Used when `VITE_INSTAGRAM_AVATAR_URL` is unset (e.g. you didn’t add a GitHub secret). Public endpoint; safe to commit.
   */
  instagramAvatarApiBase?: string
  /** Optional non-IG image (https or public path) if you ever want to override the proxy result. */
  avatarSrc?: string
  tagline?: string
  quote?: string
  email: string
  links: SocialLink[]
}

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
  aliases: ['ash', 'cal', 'itsasheruwu'],
  instagramUsername: 'itsasheruwu',
  avatarSrc: 'instagram-avatar.jpg',
  // Optional: only if `VITE_INSTAGRAM_AVATAR_URL` is unset and your avatar API is not the same host as `VITE_SPOTIFY_STATUS_URL` (Hero derives `/api/instagram-avatar` from the Spotify URL when possible).
  // instagramAvatarApiBase: 'https://<your-project>.vercel.app/api/instagram-avatar',
  tagline: 'Most active on Instagram.',
  quote: 'If I only knew then, what i know now',
  email: 's956t2hpg9@privaterelay.appleid.com',
  links: [
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@itsasheruwu',
      url: 'https://www.instagram.com/itsasheruwu/',
      status: 'active',
      primary: true,
    },
    {
      id: 'spotify',
      label: 'Spotify',
      handle: "@ash",
      url: 'https://open.spotify.com/user/316plljirvcpala37jqitv2fhese?si=512c3823d07749a2',
      artistUrl:
        'https://open.spotify.com/user/316plljirvcpala37jqitv2fhese?si=512c3823d07749a2',
      status: 'active',
    },
    {
      id: 'discord',
      label: 'Discord',
      handle: '@itsasheruwu',
      url: 'https://discord.com/users/1438433855445930059',
      status: 'active',
    },
    {
      id: 'apple_music',
      label: 'Apple Music',
      handle: "@itsasheruwu",
      url: 'https://music.apple.com/profile/itsasheruwu',
      artistUrl: 'https://music.apple.com/profile/itsasheruwu',
      status: 'active',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      handle: "@itsasheruwu",
      url: 'https://www.youtube.com/@itsasheruwu',
      artistUrl: 'https://www.youtube.com/@itsasheruwu',
      status: 'active',
    },
  ],
}
