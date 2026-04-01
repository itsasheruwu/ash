/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_STATUS_URL?: string
  /** GET /api/instagram-avatar?username=… from Vercel or npm run instagram:local-api */
  readonly VITE_INSTAGRAM_AVATAR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
