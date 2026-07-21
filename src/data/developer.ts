export type DevTool = {
  id: 'codex' | 'cursor' | 'opencode' | 'claude'
  name: string
  priceLabel: string
  /** When set, price is clickable and reveals this note. */
  priceDetail?: string
  /** When set, first matching label in priceDetail becomes a link. */
  priceDetailLink?: {
    label: string
    href: string
  }
}

export const codingLanguages = [
  'TypeScript',
  'JavaScript',
  'Java',
  'Swift',
  'Python',
] as const

export const devTools: DevTool[] = [
  {
    id: 'codex',
    name: 'Codex Pro Lite',
    priceLabel: '$100/mo',
  },
  {
    id: 'cursor',
    name: 'Cursor Pro',
    priceLabel: '$20/mo',
  },
  {
    id: 'opencode',
    name: 'OpenCode Go',
    priceLabel: '$10/mo',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    priceLabel: 'CLIProxyAPI',
    priceDetail:
      'I run free Claude Code and route my other AI subscriptions through CLIProxyAPI.',
    priceDetailLink: {
      label: 'CLIProxyAPI',
      href: 'https://github.com/router-for-me/CLIProxyAPI',
    },
  },
]
