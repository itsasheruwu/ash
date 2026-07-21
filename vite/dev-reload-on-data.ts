import type { Plugin } from 'vite'

/** Full page reload when content modules change so profile/links updates always show. */
export function devReloadOnData(): Plugin {
  return {
    name: 'dev-reload-on-data',
    apply: 'serve',
    handleHotUpdate({ file, server }) {
      if (!file.includes('/src/data/')) return
      server.ws.send({ type: 'full-reload', path: '*' })
      return []
    },
  }
}
