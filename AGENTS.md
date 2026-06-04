## Learned User Preferences

- Prefers subtle hover feedback (very light grey washes) over strong motion such as lift transforms or heavy shadow shifts on interactive elements.
- Favors a minimal links-page hero: drop redundant labels, avoid glass-card chrome for that block, tighter spacing, and a quieter sans type scale instead of large display type there.
- When requesting broader UI work, often attaches both ui-ux-concepts and frontend-design skills for the pass.
- Appreciates concise, scannable hero copy (short taglines) as the page is refined.
- Prefers project-wide Cursor commands (e.g. verify/de-slop) to stay toolchain-agnostic: describe how to discover the repo’s checks and what to accomplish, not specific languages or package managers.
- Prefers tighter vertical spacing in the links card (header and contact row) over large blank areas around those blocks.
- Wants referrals and secondary “about me” content in a dedicated Extras (“More”) section below the main social links grid, as a collapsible disclosure, not mixed into the primary SocialGrid.
- Prefer transitions-dev only on explicitly requested surfaces (e.g. developer projects reveal/modal); avoid rolling it across hero, Spotify, links, and dialogs unless asked (site-wide rollout was reverted).
- When iterating on UI in this repo, wants the Vite dev server running (`npm run dev`) so changes live-update in the browser at `http://localhost:5173/` via HMR, not the GitHub Pages build.

## Learned Workspace Facts

- The `ash` project is a React + TypeScript personal link site built with Vite; `ErrorBoundary` wraps the app in `main.tsx`; tests use Vitest and Testing Library, and ESLint is used for linting.
- Site content is centralized in `src/data/profile.ts` (`links`, `extras`, etc.); the main layout composes Hero, SocialGrid, ExtrasSection (“More”), ProjectsSection, ContactSection, and Footer. TikTok is a primary `links` row; Cursor referral lives in `profile.extras`, not the social grid.
- shadcn/ui is integrated with Tailwind v4 (`@tailwindcss/vite`), `components.json` (base-nova / neutral style), `@/` path alias, and primitives under `src/components/ui`; the links page uses Card, Badge, and Button (`buttonVariants`) for panels, coming-soon pills, and the contact CTA.
- The links UI stays dark via `class="dark"` on `<html>` for shadcn token semantics; global styling lives in `src/styles.css`. Site coral accent is isolated as `--brand` / `--brand-dim` / `--brand-strong` so it does not collide with shadcn `--accent`; subdued copy uses `--muted-foreground` where appropriate; the page keeps its gradient background instead of shadcn `bg-background` on `body`.
- UI typography remains Sora (Geist was removed after shadcn setup). Accessibility touches include a skip-to-content control, accent focus rings, and screen-reader-only text noting that some links open in a new tab.
- ESLint disables `react-refresh/only-export-components` for `src/components/ui/**` (standard for shadcn re-exports).
- `Hero.tsx` uses a `failedProxyUrl` pattern for Instagram proxy image failures so proxy URL changes retry without `setState` inside an effect.
- `npm run verify` runs `build`, then `test`, then `lint`; `.cursor/commands/verify.md` is the stack-agnostic `/verify` slash command.
- Live site: `https://itsasheruwu.github.io/ash` (GitHub repo `itsasheruwu/ash`). `.github/workflows/pages.yml` deploys on push to `main` via GitHub Actions.
- Vite inlines `VITE_*` at build time. Set `VITE_SPOTIFY_STATUS_URL` and `VITE_INSTAGRAM_AVATAR_URL` as Actions repo secrets so production matches local (Spotify status pill, Instagram proxy avatar in the hero).
- Track title colors in `SpotifyStatusPill` can be derived from album art via `src/lib/extractVibrantColorsFromImageUrl.ts`.
- Developer portfolio block: `ProjectsSection` below the links card (heading “Development Projects”); project data in `src/data/projects.ts`, languages and collapsible dev tools in `src/data/developer.ts`; uses transitions-dev (`t-panel-slide`, `t-stagger`, `t-avatar-group`, `t-modal`).
