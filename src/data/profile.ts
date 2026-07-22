export type SocialLinkStatus = 'active' | 'coming_soon'

export type SocialLink = {
  id: 'instagram' | 'spotify' | 'discord' | 'apple_music' | 'youtube' | 'tiktok'
  label: string
  handle?: string
  url?: string
  artistUrl?: string
  status: SocialLinkStatus
  primary?: boolean
}

export type ExtraItem = {
  id: 'cursor' | 'opencode' | 'about'
  label: string
  description?: string
  url?: string
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
  extras: ExtraItem[]
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
  instagramUsername: 'itsdavidig',
  avatarSrc: 'instagram-avatar.jpg',
  // Production falls back to https://ash-chi-nine.vercel.app/api/instagram-avatar when env is unset.
  // Override here only if the avatar API lives on a different host than that default / Spotify.
  tagline: 'Most active on Instagram.',
  quote: 'If I only knew then, what i know now',
  email: 's956t2hpg9@privaterelay.appleid.com',
  links: [
    {
      id: 'instagram',
      label: 'Instagram',
      handle: '@itsdavidig & @calissick',
      url: 'https://www.instagram.com/itsdavidig/',
      artistUrl: 'https://www.instagram.com/calissick/',
      status: 'active',
    },
    {
      id: 'spotify',
      label: 'Spotify',
      handle: '@ash',
      url: 'https://open.spotify.com/user/316plljirvcpala37jqitv2fhese?si=512c3823d07749a2',
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
      handle: '@itsasheruwu',
      url: 'https://music.apple.com/profile/itsasheruwu',
      status: 'active',
    },
    {
      id: 'youtube',
      label: 'YouTube',
      handle: '@itsasheruwu',
      url: 'https://www.youtube.com/@itsasheruwu',
      status: 'active',
    },
    {
      id: 'tiktok',
      label: 'TikTok',
      handle: '@itsash583 & @caldidsumshi',
      url: 'https://www.tiktok.com/@itsash583',
      artistUrl: 'https://www.tiktok.com/@caldidsumshi',
      status: 'active',
    },
  ],
  extras: [
    {
      id: 'cursor',
      label: 'Cursor',
      description: 'Referral: try Cursor with this link',
      url: 'https://cursor.com/referral?code=HFH1ZWWFBDIC',
    },
    {
      id: 'opencode',
      label: 'OpenCode Go',
      description: 'Referral: try OpenCode Go with this link',
      url: 'https://opencode.ai/go?ref=1268ZV3QHE',
    },
  ],
}
