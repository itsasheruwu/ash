import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useAvatarGroupHover } from '@/lib/useAvatarGroupHover'

type AvatarGroupProps = {
  items: ReactNode[]
  className?: string
}

export function AvatarGroup({ items, className }: AvatarGroupProps) {
  const { groupRef } = useAvatarGroupHover(true)

  return (
    <div ref={groupRef} className={cn('t-avatar-group', className)}>
      {items.map((node, i) => (
        <div key={i} className="t-avatar">
          {node}
        </div>
      ))}
    </div>
  )
}

export default AvatarGroup
