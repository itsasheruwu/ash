/**
 * Fetches an image, samples pixels from a downscaled canvas, and returns
 * 2–4 hex colors suitable for CSS gradients. Returns null on failure.
 */

type Rgb = { r: number; g: number; b: number }

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / d + 2) / 6
        break
      case bn:
        h = ((rn - gn) / d + 4) / 6
        break
    }
  }
  return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255)
    return { r: v, g: v, b: v }
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const r = hue2rgb(p, q, h + 1 / 3)
  const g = hue2rgb(p, q, h)
  const b = hue2rgb(p, q, h - 1 / 3)
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

/** Lifts very dark/white colors toward a usable range for text gradients. */
function liftToUsableHsl(h: number, s: number, l: number): { h: number; s: number; l: number } {
  let l2 = l
  if (l2 < 0.1) l2 = Math.min(0.32, l2 + 0.2)
  else if (l2 < 0.2) l2 = Math.min(0.4, l2 + 0.1)

  if (l2 > 0.9) l2 = 0.8
  else if (l2 > 0.78) l2 = 0.66

  let s2 = s
  if (s2 < 0.1 && l2 > 0.12 && l2 < 0.9) s2 = Math.max(0.12, s2 * 1.4 + 0.06)
  if (l2 < 0.2 && s2 < 0.2) s2 = Math.max(s2, 0.2)

  return { h, s: Math.min(1, s2), l: Math.min(0.85, Math.max(0.12, l2)) }
}

function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => clampByte(c).toString(16).padStart(2, '0')).join('')}`
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

const GRID = 8

/**
 * Picks 2–4 diverse, vibrant-ish colors from downscaled pixel samples.
 * Exported for unit tests.
 */
export function pickDiverseVibrantColors(pixels: Rgb[]): string[] | null {
  if (pixels.length === 0) return null

  const prepared: { rgb: Rgb; score: number }[] = []

  for (const p of pixels) {
    const { h, s, l } = rgbToHsl(p.r, p.g, p.b)
    if (l < 0.04 || l > 0.985) continue
    if (s < 0.04 && l > 0.25 && l < 0.75) continue

    const { h: hh, s: ss, l: ll } = liftToUsableHsl(h, s, l)
    const out = hslToRgb(hh, ss, ll)
    const satBoost = Math.min(1, ss * (0.5 + 0.5 * Math.min(1, 1.5 * ss)))
    const centerness = 1 - Math.abs(ll - 0.5)
    const score = satBoost * 0.65 + centerness * 0.2
    prepared.push({ rgb: out, score })
  }

  if (prepared.length === 0) return null

  prepared.sort((a, b) => b.score - a.score)

  // Dedupe similar colors (4-bit per channel)
  const seen = new Set<string>()
  const unique: { rgb: Rgb; score: number }[] = []
  for (const item of prepared) {
    const key = `${(item.rgb.r >> 4) & 0xf},${(item.rgb.g >> 4) & 0xf},${(item.rgb.b >> 4) & 0xf}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }

  const minSeparation = 38
  const maxColors = 4
  const picked: Rgb[] = []

  for (const { rgb } of unique) {
    if (picked.length >= maxColors) break
    if (picked.length === 0) {
      picked.push(rgb)
      continue
    }
    const d = Math.min(...picked.map((c) => colorDistance(c, rgb)))
    if (d >= minSeparation) picked.push(rgb)
  }

  if (picked.length < 2) {
    for (const { rgb } of unique) {
      if (picked.length >= 2) break
      if (picked.some((c) => colorDistance(c, rgb) < 18)) continue
      picked.push(rgb)
    }
  }

  if (picked.length < 2) {
    for (const { rgb } of unique) {
      if (picked.length >= 2) break
      if (!picked.some((c) => c === rgb)) picked.push(rgb)
    }
  }

  if (picked.length < 2) {
    if (prepared[0] && prepared[1]) {
      return [rgbToHex(prepared[0].rgb), rgbToHex(prepared[1].rgb)]
    }
    return null
  }

  return picked.slice(0, maxColors).map(rgbToHex)
}

function samplePixelsFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Rgb[] {
  const out: Rgb[] = []
  const stepX = Math.max(1, Math.floor(width / GRID))
  const stepY = Math.max(1, Math.floor(height / GRID))
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4
      const a = data[i + 3] ?? 255
      if (a < 32) continue
      out.push({ r: data[i] ?? 0, g: data[i + 1] ?? 0, b: data[i + 2] ?? 0 })
    }
  }
  return out
}

function loadImageElement(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const img = new Image()
    const onAbort = () => {
      img.src = ''
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    img.decoding = 'async'
    img.onload = () => {
      signal.removeEventListener('abort', onAbort)
      resolve(img)
    }
    img.onerror = () => {
      signal.removeEventListener('abort', onAbort)
      reject(new Error('image_load_failed'))
    }
    img.src = src
  })
}

const DOWNSCALE = 32

/**
 * Fetches a URL, decodes the image, samples pixels, returns 2–4 hex colors.
 */
export async function extractVibrantColorsFromImageUrl(
  url: string,
  signal: AbortSignal,
): Promise<string[] | null> {
  const t = url.trim()
  if (!t || !/^https:\/\//i.test(t)) return null

  const res = await fetch(t, { mode: 'cors', credentials: 'omit', signal, cache: 'force-cache' })
  if (!res.ok) return null
  const blob = await res.blob()
  if (signal.aborted) return null

  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await loadImageElement(objectUrl, signal)
    if (typeof document === 'undefined' || !document.createElement) return null

    const w = DOWNSCALE
    const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * DOWNSCALE))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    const imageData = ctx.getImageData(0, 0, w, h)
    const pixels = samplePixelsFromImageData(imageData.data, w, h)
    return pickDiverseVibrantColors(pixels)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function padStopsToFourColors(colors: string[]): [string, string, string, string] {
  const c = colors.slice(0, 4)
  if (c.length >= 4) {
    return [c[0]!, c[1]!, c[2]!, c[3]!]
  }
  if (c.length === 3) {
    return [c[0]!, c[1]!, c[2]!, c[0]!]
  }
  if (c.length === 2) {
    return [c[0]!, c[1]!, c[0]!, c[1]!]
  }
  return [c[0]!, c[0]!, c[0]!, c[0]!]
}
