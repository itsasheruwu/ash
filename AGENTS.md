## Learned User Preferences

- Prefers subtle hover feedback (very light grey washes) over strong motion such as lift transforms or heavy shadow shifts on interactive elements.
- Favors a minimal links-page hero: drop redundant labels, avoid glass-card chrome for that block, tighter spacing, and a quieter sans type scale instead of large display type there.
- When requesting broader UI work, often attaches both ui-ux-concepts and frontend-design skills for the pass.
- Appreciates concise, scannable hero copy (short taglines) as the page is refined.
- Prefers project-wide Cursor commands (e.g. verify/de-slop) to stay toolchain-agnostic: describe how to discover the repo’s checks and what to accomplish, not specific languages or package managers.

## Learned Workspace Facts

- The `ash` project is a React + TypeScript personal link site built with Vite; tests use Vitest and Testing Library, and ESLint is used for linting.
- Site content and outbound social rows are centralized in `src/data/profile.ts`; the main layout composes Hero, SocialGrid, ContactSection, and Footer.
- shadcn/ui is integrated with Tailwind v4 (`@tailwindcss/vite`), `components.json` (base-nova / neutral style), `@/` path alias, and primitives under `src/components/ui`; the links page uses Card, Badge, and Button (`buttonVariants`) for panels, coming-soon pills, and the contact CTA.
- The links UI stays dark via `class="dark"` on `<html>` for shadcn token semantics; global styling lives in `src/styles.css`. Site coral accent is isolated as `--brand` / `--brand-dim` / `--brand-strong` so it does not collide with shadcn `--accent`; subdued copy uses `--muted-foreground` where appropriate; the page keeps its gradient background instead of shadcn `bg-background` on `body`.
- UI typography remains Sora (Geist was removed after shadcn setup). Accessibility touches include a skip-to-content control, accent focus rings, and screen-reader-only text noting that some links open in a new tab.
- ESLint disables `react-refresh/only-export-components` for `src/components/ui/**` (standard for shadcn re-exports).
- `Hero.tsx` uses a `failedProxyUrl` pattern for Instagram proxy image failures so proxy URL changes retry without `setState` inside an effect.
- `npm run verify` runs `build`, then `test`, then `lint` in one command (`npm run build && npm test && npm run lint`).
- `.cursor/commands/verify.md` is the `/verify` slash command for a combined verification and de-slop pass; the instructions are written to stay stack-agnostic.