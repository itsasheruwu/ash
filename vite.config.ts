import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

import { localApiMiddleware } from './vite/local-api-middleware'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'ash'
const base = process.env.NODE_ENV === 'production' ? `/${repositoryName}/` : '/'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'local-api',
      configureServer(server) {
        server.middlewares.use(localApiMiddleware())
      },
    },
  ],
  base,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
