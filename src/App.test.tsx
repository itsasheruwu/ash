import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Ash social hub', () => {
  it('renders the display name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ash' })).toBeInTheDocument()
  })

  it('renders active Instagram and Spotify links', () => {
    render(<App />)

    const instagram = screen.getByRole('link', { name: /open instagram/i })
    const spotify = screen.getByRole('link', { name: /open spotify/i })

    expect(instagram).toHaveAttribute('href', expect.stringContaining('instagram.com'))
    expect(spotify).toHaveAttribute('href', expect.stringContaining('open.spotify.com'))
    expect(instagram).toHaveAttribute('target', '_blank')
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders youtube as non-clickable coming soon card', () => {
    render(<App />)
    expect(screen.getByLabelText(/youtube coming soon/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /open youtube/i })).not.toBeInTheDocument()
  })

  it('does not render TikTok or X cards', () => {
    render(<App />)
    expect(screen.queryByText(/tiktok/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^x$/i)).not.toBeInTheDocument()
  })

  it('renders a contact mailto button with the exact email', () => {
    render(<App />)
    const contact = screen.getByRole('link', { name: /email me/i })
    expect(contact).toHaveAttribute('href', 'mailto:s956t2hpg9@privaterelay.appleid.com')
  })
})
