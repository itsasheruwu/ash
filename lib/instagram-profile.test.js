import { describe, expect, it } from 'vitest'
import { profileImageFromHtml } from './instagram-profile.js'

const page = (url = 'https://www.instagram.com/itsdavidig/', image = 'https://scontent.cdninstagram.com/photo.jpg?a=1&amp;b=2') =>
  `<meta property="og:type" content="profile"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}">`

describe('Instagram profile image fallback', () => {
  it('extracts the image from the requested profile', () => {
    expect(profileImageFromHtml(page(), 'itsdavidig')).toBe('https://scontent.cdninstagram.com/photo.jpg?a=1&b=2')
  })
  it('rejects login pages, other profiles and unsafe image hosts', () => {
    expect(profileImageFromHtml('<meta property="og:image" content="https://static.cdninstagram.com/logo.jpg">', 'itsdavidig')).toBeNull()
    expect(profileImageFromHtml(page('https://www.instagram.com/someoneelse/'), 'itsdavidig')).toBeNull()
    expect(profileImageFromHtml(page(undefined, 'https://cdninstagram.com.evil.example/photo.jpg'), 'itsdavidig')).toBeNull()
  })
})
