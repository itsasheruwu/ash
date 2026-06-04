export type DevTool = {
  id: 'codex' | 'cursor' | 'claude'
  name: string
  priceLabel: string
  /** When set, price is clickable and reveals this note. */
  priceDetail?: string
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
    id: 'claude',
    name: 'Claude Code',
    priceLabel: 'Usage based',
    priceDetail:
      'I only use the free version of Claude Code with API-based, pay-as-you-go pricing.',
  },
]
