import { useEffect, useRef } from 'react'

function readScopeNumber(scope: Element, name: string, fallback: number): number {
  const raw = getComputedStyle(scope).getPropertyValue(name)
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readScopeEase(scope: Element, name: string, fallback: string): string {
  return getComputedStyle(scope).getPropertyValue(name).trim() || fallback
}

export function useAvatarGroupHover(active = true) {
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = groupRef.current
    if (!root || !active) return

    const avatars = Array.from(root.querySelectorAll<HTMLElement>('.t-avatar'))
    const group = root
    let hoveredIdx: number | null = null

    function setShifts(activeIdx: number | null, phase: 'in' | 'out') {
      const lift = readScopeNumber(group, '--avatar-lift', -4)
      const falloff = readScopeNumber(group, '--avatar-falloff', 0.45)
      const scale = readScopeNumber(group, '--avatar-scale', 1.05)
      const tf =
        phase === 'out'
          ? readScopeEase(group, '--avatar-ease-out', 'cubic-bezier(0.34, 3.85, 0.64, 1)')
          : readScopeEase(group, '--avatar-ease-in', 'cubic-bezier(0.22, 1, 0.36, 1)')

      avatars.forEach((el, i) => {
        el.style.transitionTimingFunction = tf
        if (activeIdx == null) {
          el.style.setProperty('--shift', '0px')
          el.style.setProperty('--scale-active', '1')
          el.style.removeProperty('z-index')
          return
        }
        const distance = Math.abs(i - activeIdx)
        el.style.setProperty('--shift', `${(lift * Math.pow(falloff, distance)).toFixed(3)}px`)
        el.style.setProperty('--scale-active', i === activeIdx ? String(scale) : '1')
        el.style.zIndex = i === activeIdx ? '10' : String(i + 1)
      })
    }

    const enterHandlers = avatars.map((el, i) => {
      const handler = () => {
        if (hoveredIdx === i) return
        hoveredIdx = i
        setShifts(i, 'in')
      }
      el.addEventListener('mouseover', handler)
      return { el, handler }
    })

    const onLeave = () => {
      hoveredIdx = null
      setShifts(null, 'out')
    }
    root.addEventListener('mouseleave', onLeave)

    return () => {
      enterHandlers.forEach(({ el, handler }) => el.removeEventListener('mouseover', handler))
      root.removeEventListener('mouseleave', onLeave)
      avatars.forEach((el) => {
        el.style.removeProperty('transition-timing-function')
        el.style.removeProperty('--shift')
        el.style.removeProperty('--scale-active')
      })
    }
  }, [active])

  return { groupRef }
}
