/** Read a profile image only from a matching Instagram profile page. */
export function profileImageFromHtml(html, username) {
  const meta = (name) => {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
      const attrs = Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((m) => [m[1].toLowerCase(), m[2]]))
      if (attrs.property === name) return attrs.content
    }
    return null
  }
  if (meta('og:type') !== 'profile') return null
  try {
    const profile = new URL(meta('og:url'))
    if (profile.hostname !== 'www.instagram.com' || profile.pathname.replace(/^\/+|\/+$/g, '').toLowerCase() !== username.toLowerCase()) return null
    const raw = meta('og:image')?.replace(/&amp;|&#38;/g, '&')
    const image = new URL(raw)
    if (image.protocol !== 'https:' || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(image.hostname) || image.hostname === 'static.cdninstagram.com' || /\/rsrc\.php\b/i.test(image.pathname)) return null
    return image.href
  } catch {
    return null
  }
}
