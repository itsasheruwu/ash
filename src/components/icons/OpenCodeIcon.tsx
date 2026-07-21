import type { SVGProps } from 'react'

/** OpenCode square mark (anomalyco/opencode brand assets). */
export function OpenCodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g transform="translate(30, 0)">
        <path
          fill="currentColor"
          d="M180 240H60V120H180V240ZM180 60H60V240H180V60ZM240 300H0V0H240V300Z"
          fillRule="evenodd"
        />
      </g>
    </svg>
  )
}
