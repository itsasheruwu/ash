/**
 * Fetch @instagramUsername (or profile links) avatar into public/instagram-avatar.jpg.
 * Used by GitHub Pages CI so the static fallback stays current when the Vercel
 * proxy cannot scrape Instagram from a datacenter IP.
 *
 * Exit 0 even on failure (keeps the committed fallback).
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outPath = join(root, 'public', 'instagram-avatar.jpg')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const IG_HEADERS = {
  'User-Agent': UA,
  'X-IG-App-ID': '936619743392459',
  Accept: '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.instagram.com/',
  Origin: 'https://www.instagram.com',
}

function isLikelyRealProfilePicUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host === 'static.cdninstagram.com') return false
    if (/\/rsrc\.php\b/i.test(url)) return false
    return (
      host.includes('cdninstagram.com') ||
      host.includes('fbcdn.net') ||
      host.includes('instagram.com')
    )
  } catch {
    return false
  }
}

async function profilePicUrl(username) {
  for (const host of ['i.instagram.com', 'www.instagram.com']) {
    const res = await fetch(
      `https://${host}/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
      { headers: IG_HEADERS },
    )
    if (!res.ok) continue
    const data = await res.json()
    const pic =
      data?.data?.user?.profile_pic_url_hd ?? data?.data?.user?.profile_pic_url ?? null
    if (typeof pic === 'string' && isLikelyRealProfilePicUrl(pic)) return pic
  }
  return null
}

async function main() {
  const username = process.env.INSTAGRAM_USERNAME?.trim() || 'itsdavidig'
  const picUrl = await profilePicUrl(username)
  if (!picUrl) {
    console.warn(`[refresh-instagram-avatar] no profile pic for @${username}; keeping existing file`)
    return
  }
  const imgRes = await fetch(picUrl, {
    headers: {
      'User-Agent': UA,
      Referer: 'https://www.instagram.com/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  })
  if (!imgRes.ok) {
    console.warn(`[refresh-instagram-avatar] image fetch ${imgRes.status}; keeping existing file`)
    return
  }
  const buf = Buffer.from(await imgRes.arrayBuffer())
  await writeFile(outPath, buf)
  console.log(`[refresh-instagram-avatar] wrote ${outPath} (${buf.length} bytes) from @${username}`)
}

main().catch((err) => {
  console.warn('[refresh-instagram-avatar] failed:', err?.message || err)
})
