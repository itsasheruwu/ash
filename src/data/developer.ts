export type DevTool = {
  id: 'claude' | 'codex' | 'wispr' | 'x'
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
    id: 'claude',
    name: 'Claude Max 5x',
    priceLabel: '$100/mo',
  },
  {
    id: 'codex',
    name: 'Codex Pro Lite',
    priceLabel: '$100/mo',
  },
  {
    id: 'wispr',
    name: 'Wispr Flow',
    priceLabel: 'Free',
  },
  {
    id: 'x',
    name: 'X Subscription Premium',
    priceLabel: '$30/mo',
  },
]
