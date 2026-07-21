import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { profile } from './data/profile'

vi.mock('@/lib/extractVibrantColorsFromImageUrl', async (importOriginal) => {
  const m = await importOriginal<typeof import('./lib/extractVibrantColorsFromImageUrl')>()
  return {
    ...m,
    extractVibrantColorsFromImageUrl: () => Promise.resolve(null),
  }
})

/** Flushes SpotifyStatusPill / fetch microtasks so async state updates stay inside `act`. */
function flushAsyncUi() {
  return act(async () => {
    await new Promise<void>((r) => {
      setTimeout(r, 0)
    })
  })
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (): Promise<Response> =>
        Promise.resolve({
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ ok: true, state: 'idle' as const, track: null }),
        } as Response),
    ) as unknown as typeof fetch,
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Ash social hub', () => {
  it('renders the display name', async () => {
    render(<App />)
    await flushAsyncUi()
    expect(screen.getByRole('heading', { level: 1, name: 'Ash' })).toBeInTheDocument()
  })

  it('shows hero aliases when the trigger is focused and hides on Escape', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()
    const trigger = screen.getByRole('button', { name: /other names and aliases/i })
    fireEvent.focus(trigger)
    expect(screen.getByText('Aliases')).toBeInTheDocument()
    expect(screen.getByText('cal')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByText('Aliases')).not.toBeInTheDocument()
  })

  it('renders active Instagram, Spotify, Apple Music, and YouTube destinations', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()

    const instagram = screen.getByRole('button', { name: /open instagram/i })
    expect(screen.getByText('@itsdavidig & @calissick')).toBeInTheDocument()
    await user.click(instagram)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const mainIg = screen.getByRole('link', { name: /^@itsdavidig$/i })
    const altIg = screen.getByRole('link', { name: /^@calissick$/i })
    expect(mainIg).toHaveAttribute('href', 'https://www.instagram.com/itsdavidig/')
    expect(altIg).toHaveAttribute('href', 'https://www.instagram.com/calissick/')
    expect(mainIg).toHaveAttribute('target', '_blank')
    expect(altIg).toHaveAttribute('target', '_blank')
    expect(mainIg).toHaveAttribute('rel', 'noopener noreferrer')
    expect(altIg).toHaveAttribute('rel', 'noopener noreferrer')

    const closeInstagramDialog = screen.getByRole('button', { name: /close/i })
    await user.click(closeInstagramDialog)

    const discord = screen.getByRole('link', { name: /open discord/i })
    expect(discord).toHaveAttribute('href', 'https://discord.com/users/1438433855445930059')
    expect(discord).toHaveAttribute('target', '_blank')
    expect(discord).toHaveAttribute('rel', 'noopener noreferrer')

    const spotify = screen.getByRole('link', { name: /open spotify/i })
    expect(spotify).toHaveAttribute(
      'href',
      'https://open.spotify.com/user/316plljirvcpala37jqitv2fhese?si=512c3823d07749a2'
    )
    expect(spotify).toHaveAttribute('target', '_blank')
    expect(spotify).toHaveAttribute('rel', 'noopener noreferrer')

    const appleMusic = screen.getByRole('link', { name: /open apple music/i })
    expect(appleMusic).toHaveAttribute('href', 'https://music.apple.com/profile/itsasheruwu')
    expect(appleMusic).toHaveAttribute('target', '_blank')
    expect(appleMusic).toHaveAttribute('rel', 'noopener noreferrer')

    const youtube = screen.getByRole('link', { name: /open youtube/i })
    expect(youtube).toHaveAttribute('href', 'https://www.youtube.com/@itsasheruwu')
    expect(youtube).toHaveAttribute('target', '_blank')
    expect(youtube).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('has no coming-soon links in profile (aligns with live count)', async () => {
    // If you add `coming_soon` entries, update this and the live-link count test.
    expect(profile.links.filter((l) => l.status === 'coming_soon')).toHaveLength(0)
    render(<App />)
    await flushAsyncUi()
    expect(screen.getByText('6 live links')).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('shows a compact links summary', async () => {
    render(<App />)
    await flushAsyncUi()
    expect(screen.getByText('6 live links')).toBeInTheDocument()
  })

  it('renders TikTok in the main links grid with both accounts', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()
    const tiktok = screen.getByRole('button', { name: /open tiktok/i })
    expect(screen.getByText('@itsash583 & @caldidsumshi')).toBeInTheDocument()
    await user.click(tiktok)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const ashTiktok = screen.getByRole('link', { name: /^@itsash583$/i })
    const calTiktok = screen.getByRole('link', { name: /^@caldidsumshi$/i })
    expect(ashTiktok).toHaveAttribute('href', 'https://www.tiktok.com/@itsash583')
    expect(calTiktok).toHaveAttribute('href', 'https://www.tiktok.com/@caldidsumshi')
    expect(ashTiktok).toHaveAttribute('target', '_blank')
    expect(calTiktok).toHaveAttribute('target', '_blank')
    expect(ashTiktok).toHaveAttribute('rel', 'noopener noreferrer')
    expect(calTiktok).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the Cursor referral in the More section when expanded', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()
    expect(screen.getByRole('heading', { level: 2, name: 'More' })).toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: 'More' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: /open cursor/i })).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const cursor = screen.getByRole('link', { name: /open cursor/i })
    expect(cursor).toHaveAttribute('href', 'https://cursor.com/referral?code=HFH1ZWWFBDIC')
    expect(cursor).toHaveAttribute('target', '_blank')
    expect(cursor).toHaveAttribute('rel', 'noopener noreferrer')

    const opencode = screen.getByRole('link', { name: /open opencode go/i })
    expect(opencode).toHaveAttribute('href', 'https://opencode.ai/go?ref=1268ZV3QHE')
    expect(opencode).toHaveAttribute('target', '_blank')
    expect(opencode).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('does not render an X card', async () => {
    render(<App />)
    await flushAsyncUi()
    expect(screen.queryByText(/^x$/i)).not.toBeInTheDocument()
  })

  it('renders a contact mailto button with the exact email', async () => {
    render(<App />)
    await flushAsyncUi()
    const contact = screen.getByRole('link', { name: /email me/i })
    expect(contact).toHaveAttribute('href', 'mailto:s956t2hpg9@privaterelay.appleid.com')
  })

  it('renders the developer projects section', async () => {
    render(<App />)
    await flushAsyncUi()
    expect(screen.getByRole('heading', { level: 2, name: 'Development Projects' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Programming languages' })).toHaveTextContent('TypeScript')
    expect(screen.getByRole('button', { name: /view details for graft/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view details for ash links/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view details for auto trade mod/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /view details for video frame post picker/i })
    ).toBeInTheDocument()
  })

  it('expands the tools list in the developer section', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()

    const trigger = screen.getByRole('button', { name: 'Tools' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Codex Pro Lite')).not.toBeInTheDocument()

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const projectsSection = screen.getByRole('heading', { level: 2, name: 'Development Projects' }).closest('section')!
    const tools = within(projectsSection)
    expect(tools.getByText('Codex Pro Lite')).toBeInTheDocument()
    expect(tools.getByText('$100/mo')).toBeInTheDocument()
    expect(tools.getByText('Cursor Pro')).toBeInTheDocument()
    expect(tools.getByText('$20/mo')).toBeInTheDocument()
    expect(tools.getByText('OpenCode Go')).toBeInTheDocument()
    expect(tools.getByText('$10/mo')).toBeInTheDocument()
    expect(tools.getByText('Claude Code')).toBeInTheDocument()
    expect(tools.getByText('CLIProxyAPI')).toBeInTheDocument()
  })

  it('expands Claude Code CLIProxyAPI detail with GitHub link when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()

    await user.click(screen.getByRole('button', { name: 'Tools' }))
    const priceButton = screen.getByRole('button', { name: 'CLIProxyAPI' })
    expect(priceButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(priceButton)
    expect(priceButton).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText(/run free Claude Code and route my other AI subscriptions through/i)
    ).toBeInTheDocument()
    const cliproxyLink = screen.getByRole('link', { name: 'CLIProxyAPI' })
    expect(cliproxyLink).toHaveAttribute('href', 'https://github.com/router-for-me/CLIProxyAPI')
    expect(cliproxyLink).toHaveAttribute('target', '_blank')
    expect(cliproxyLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('opens a project detail modal with GitHub link', async () => {
    const user = userEvent.setup()
    render(<App />)
    await flushAsyncUi()

    await user.click(screen.getByRole('button', { name: /view details for graft/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Graft' })).toBeInTheDocument()

    const github = screen.getByRole('link', { name: /view on github/i })
    expect(github).toHaveAttribute('href', 'https://github.com/itsasheruwu/graft')
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noopener noreferrer')

    await user.click(screen.getByRole('button', { name: /^close$/i }))
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 200)
      })
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
