/**
 * Vercel Serverless: GET /api/instagram-avatar?username=someuser
 *
 * - Default: JSON { ok, profilePicUrl } (for debugging / other clients).
 * - `?format=image`: binary image bytes proxied from Instagram’s CDN. Use this for
 *   `<img src>`: the CDN often blocks hotlinks from other sites without this proxy.
 *
 * Unofficial Instagram endpoints; may break if they change their API.
 * Optional server env: `INSTAGRAM_SESSIONID` (and optionally `INSTAGRAM_DS_USER_ID`)
 * improves success from datacenter IPs when anonymous web_profile_info is blocked.
 *
 * CORS: open (*).
 */

const IG_USER_RE = /^[a-zA-Z0-9._]{1,30}$/

const isDev = process.env.NODE_ENV !== 'production'

function setAvatarCache(res, productionValue) {
  res.setHeader('Cache-Control', isDev ? 'no-store' : productionValue)
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/** Instagram rejects bare Node fetch without browser-like Sec-Fetch / Referer. */
const IG_HEADERS_JSON = {
  'User-Agent': UA,
  'X-IG-App-ID': '936619743392459',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.instagram.com/',
  Origin: 'https://www.instagram.com',
  'Sec-Fetch-Site': 'same-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
}

const IG_HEADERS_HTML = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.instagram.com/',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Dest': 'document',
}

/** Instagram CDN usually requires a browser Referer; bare <img src="cdn…"> fails in‑browser. */
const IG_CDN_IMAGE_HEADERS = {
  'User-Agent': UA,
  Referer: 'https://www.instagram.com/',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
}

function sessionCookieHeader() {
  const sessionid = process.env.INSTAGRAM_SESSIONID?.trim()
  if (!sessionid) return null
  const parts = [`sessionid=${sessionid}`]
  const ds = process.env.INSTAGRAM_DS_USER_ID?.trim()
  if (ds) parts.push(`ds_user_id=${ds}`)
  return parts.join('; ')
}

function withOptionalSession(headers) {
  const cookie = sessionCookieHeader()
  if (!cookie) return headers
  return { ...headers, Cookie: cookie }
}

/**
 * Login walls and blocked datacenter responses often surface Instagram’s static
 * brand assets (`rsrc.php` on static.cdninstagram.com), not a real profile photo.
 */
function isLikelyRealProfilePicUrl(url) {
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return false
  let host
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  if (host === 'static.cdninstagram.com' || host.endsWith('.facebook.com')) return false
  if (/\/rsrc\.php\b/i.test(url)) return false
  // Real avatars are almost always on scontent*.cdninstagram.com (or fbcdn).
  if (
    host.includes('cdninstagram.com') ||
    host.includes('fbcdn.net') ||
    host.includes('instagram.com')
  ) {
    return true
  }
  return false
}

async function resolveProfilePicUrl(username) {
  let profilePicUrl = await profilePicFromWebApi(username)
  if (!profilePicUrl) {
    profilePicUrl = await profilePicFromProfileHtml(username)
  }
  return profilePicUrl
}

async function profilePicFromWebApi(username) {
  const hosts = ['i.instagram.com', 'www.instagram.com']
  for (const host of hosts) {
    const url = `https://${host}/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`
    const res = await fetch(url, {
      headers: withOptionalSession(IG_HEADERS_JSON),
    })
    if (!res.ok) {
      console.error('instagram-avatar web_profile_info', host, res.status)
      continue
    }
    let data
    try {
      data = await res.json()
    } catch {
      continue
    }
    const user = data?.data?.user
    const pic = user?.profile_pic_url_hd ?? user?.profile_pic_url ?? null
    const normalized = normalizeInstagramImageUrl(pic)
    if (normalized) return normalized
  }
  return null
}

/** Fallback if the JSON API is blocked (logged-in wall, etc.). */
async function profilePicFromProfileHtml(username) {
  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: withOptionalSession(IG_HEADERS_HTML),
  })
  if (!res.ok) return null
  const html = await res.text()
  const hd = html.match(/"profile_pic_url_hd":"([^"]+)"/)
  const lo = html.match(/"profile_pic_url":"([^"]+)"/)
  // Prefer structured fields; og:image is often the IG logo on login walls.
  const raw = hd?.[1] ?? lo?.[1]
  return normalizeInstagramImageUrl(raw)
}

function normalizeInstagramImageUrl(raw) {
  if (typeof raw !== 'string') return null
  const url = raw
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
  if (!url.startsWith('http')) return null
  if (!isLikelyRealProfilePicUrl(url)) {
    console.error('instagram-avatar rejected non-profile image', url.slice(0, 96))
    return null
  }
  return url
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const href = typeof req.url === 'string' ? req.url : ''
  const q = new URL(href, 'http://n').searchParams
  const username = q.get('username')
  const asImage =
    q.get('format') === 'image' || q.get('image') === '1'

  if (!username || !IG_USER_RE.test(username)) {
    setAvatarCache(res, 'public, s-maxage=60')
    res.status(200).json({ ok: false, error: 'invalid_username' })
    return
  }

  try {
    const profilePicUrl = await resolveProfilePicUrl(username)
    if (!profilePicUrl) {
      if (asImage) {
        res.status(404).end()
        return
      }
      setAvatarCache(res, 'public, s-maxage=300')
      res.status(200).json({ ok: false, error: 'not_found' })
      return
    }

    if (asImage) {
      const imgRes = await fetch(profilePicUrl, { headers: IG_CDN_IMAGE_HEADERS })
      if (!imgRes.ok) {
        console.error('instagram-avatar image fetch', imgRes.status, profilePicUrl.slice(0, 80))
        res.status(502).end()
        return
      }
      const buf = Buffer.from(await imgRes.arrayBuffer())
      const ctype = imgRes.headers.get('content-type') || 'image/jpeg'
      res.setHeader('Content-Type', ctype)
      setAvatarCache(res, 'public, s-maxage=86400, stale-while-revalidate=604800')
      res.status(200).end(buf)
      return
    }

    setAvatarCache(res, 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ ok: true, username, profilePicUrl })
  } catch (e) {
    console.error('instagram-avatar error', e)
    if (asImage) {
      res.status(500).end()
      return
    }
    setAvatarCache(res, 'public, s-maxage=60')
    res.status(200).json({ ok: false, error: 'upstream_error' })
  }
}
