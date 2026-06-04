# ash links

Personal link site for Ash: social profiles, contact, live Spotify status, and a small developer portfolio block.

**Live:** [itsasheruwu.github.io/ash](https://itsasheruwu.github.io/ash)

## Features

- **Links card** with Instagram (pinned), Apple Music, Discord, Spotify, TikTok, YouTube, and multi-profile choosers where needed
- **More** collapsible section for secondary links (e.g. Cursor referral)
- **Development Projects** scroll-revealed section: overlapping project avatars, name tooltips, detail modal, languages, and collapsible dev tools
- **Spotify status pill** (fixed corner): morphs into track details; on phones (≤480px) tucks to the left edge and can be dragged out
- **Hero** with proxied Instagram avatar, alias popover, and quote
- **Contact** mailto CTA and optional corner audio tag

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui (base-nova)
- Vitest + Testing Library
- ESLint
- Deployed via GitHub Actions → GitHub Pages

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/). Changes hot-reload through Vite.

### Check everything

```bash
npm run verify
```

Runs `build`, `test`, then `lint`.

### Optional live data locally

Spotify and Instagram avatar need backend URLs at build time (`VITE_*` vars). Without them, the pill shows a fallback state and the hero may use a static avatar.

| Variable | Purpose |
| --- | --- |
| `VITE_SPOTIFY_STATUS_URL` | JSON endpoint for now playing / last played |
| `VITE_INSTAGRAM_AVATAR_URL` | Instagram avatar proxy (e.g. `/api/instagram-avatar?username=…`) |

See [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md) for the full Spotify flow (`npm run setup:spotify`, local API scripts).

For production, set the same secrets in the GitHub repo so Actions builds match local.

## Project layout

```
src/
  App.tsx                 Page shell
  data/
    profile.ts            Links, extras, hero copy, email
    projects.ts           Portfolio projects (icons, GitHub, copy)
    developer.ts          Languages and dev tools list
  components/
    Hero.tsx              Avatar, title, aliases, tagline, quote
    SocialGrid.tsx        Primary social link rows
    ExtrasSection.tsx     Collapsible “More” block
    ProjectsSection.tsx   Development Projects + tools
    SpotifyStatusPill.tsx Corner playback pill
    ContactSection.tsx    Email CTA
  styles.css              Global theme + transitions-dev snippets
api/                      Vercel-style serverless handlers (Spotify, Instagram)
public/projects/          Project icon assets
```

Content edits usually start in `src/data/profile.ts`, `projects.ts`, and `developer.ts`.

## Deploy

Pushes to `main` deploy automatically (`.github/workflows/pages.yml`).

Manual deploy:

```bash
npm run deploy
```

Uses `gh-pages` to publish `dist/`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Vitest (single run) |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint |
| `npm run verify` | build + test + lint |
| `npm run setup:spotify` | Interactive Spotify OAuth setup |
| `npm run spotify:callback` | Local OAuth redirect listener |
| `npm run spotify:local-api` | Local Spotify status API |
| `npm run instagram:local-api` | Local Instagram avatar proxy |
