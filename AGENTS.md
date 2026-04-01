## Learned User Preferences

- Prefers subtle hover feedback (very light grey washes) over strong motion such as lift transforms or heavy shadow shifts on interactive elements.
- Favors a minimal links-page hero: drop redundant labels, avoid glass-card chrome for that block, tighter spacing, and a quieter sans type scale instead of large display type there.
- When requesting broader UI work, often attaches both ui-ux-concepts and frontend-design skills for the pass.
- Appreciates concise, scannable hero copy (short taglines) as the page is refined.

## Learned Workspace Facts

- The `ash` project is a React + TypeScript personal link site built with Vite; tests use Vitest and Testing Library, and ESLint is used for linting.
- Site content and outbound social rows are centralized in `src/data/profile.ts`; the main layout composes Hero, SocialGrid, ContactSection, and Footer.
- `SpotifyCanvas.tsx` remains in the repo for possible reuse but is not used by the default links layout.
- The links UI targets a dark theme with web fonts loaded from `index.html`; accessibility touches include a skip-to-content control, accent focus rings, and screen-reader-only text noting that some links open in a new tab.
