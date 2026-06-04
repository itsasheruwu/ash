import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'

const MOBILE_MQ = '(max-width: 480px)'
const DRAG_THRESHOLD_PX = 8
const PEEK_PX = 44

type DockState = 'tucked' | 'revealed'

function readMobileMatch() {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(MOBILE_MQ).matches
}

type UseSpotifyPillDockOptions = {
  outerRef: RefObject<HTMLElement | null>
  expanded: boolean
  enabled: boolean
}

export function useSpotifyPillDock({ outerRef, expanded, enabled }: UseSpotifyPillDockOptions) {
  const [matchesMobile, setMatchesMobile] = useState(readMobileMatch)
  const [dockState, setDockState] = useState<DockState>('tucked')
  const [dragOffsetPx, setDragOffsetPx] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [maxTuckPx, setMaxTuckPx] = useState(0)

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startOffset: 0,
  })
  const suppressClickRef = useRef(false)

  const isMobileDock = enabled && matchesMobile
  const effectiveDockState: DockState =
    isMobileDock && expanded ? 'revealed' : dockState

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => setMatchesMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const measure = useCallback(() => {
    const el = outerRef.current
    if (!el) return
    const width = el.getBoundingClientRect().width
    setMaxTuckPx(Math.max(0, width - PEEK_PX))
  }, [outerRef])

  useEffect(() => {
    if (!isMobileDock) return
    measure()
    const el = outerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMobileDock, measure, outerRef])

  const tuckedOffsetPx = -maxTuckPx
  const restingOffsetPx = effectiveDockState === 'tucked' ? tuckedOffsetPx : 0
  const currentOffsetPx = dragOffsetPx ?? restingOffsetPx

  const style: CSSProperties | undefined =
    isMobileDock && maxTuckPx > 0
      ? { transform: `translateX(${currentOffsetPx}px)` }
      : undefined

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isMobileDock || expanded) return
      dragRef.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startOffset: currentOffsetPx,
      }
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [currentOffsetPx, expanded, isMobileDock],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current.active || !isMobileDock) return
      const dx = event.clientX - dragRef.current.startX
      if (Math.abs(dx) >= DRAG_THRESHOLD_PX) {
        dragRef.current.moved = true
      }
      const next = Math.min(0, Math.max(tuckedOffsetPx, dragRef.current.startOffset + dx))
      setDragOffsetPx(next)
    },
    [isMobileDock, tuckedOffsetPx],
  )

  const finishDrag = useCallback(() => {
    if (!dragRef.current.active) return
    const moved = dragRef.current.moved
    dragRef.current.active = false
    setIsDragging(false)

    if (moved) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
      const offset = dragOffsetPx ?? restingOffsetPx
      setDockState(offset > tuckedOffsetPx / 2 ? 'revealed' : 'tucked')
    }

    setDragOffsetPx(null)
  }, [dragOffsetPx, restingOffsetPx, tuckedOffsetPx])

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current.active) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      finishDrag()
    },
    [finishDrag],
  )

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!dragRef.current.active) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      finishDrag()
    },
    [finishDrag],
  )

  const consumeSuppressedClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return true
    }
    return false
  }, [])

  const revealIfTucked = useCallback(() => {
    if (effectiveDockState === 'tucked') {
      setDockState('revealed')
      return true
    }
    return false
  }, [effectiveDockState])

  return {
    isMobileDock,
    dockState: effectiveDockState,
    classNames: {
      mobileDock: isMobileDock && 'spotify-status-pill--mobile-dock',
      dragging: isDragging && 'spotify-status-pill--mobile-dock-dragging',
      tucked:
        isMobileDock && effectiveDockState === 'tucked' && 'spotify-status-pill--mobile-dock-tucked',
      revealed: isMobileDock && effectiveDockState === 'revealed' && 'spotify-status-pill--mobile-dock-revealed',
    },
    style,
    dataDock: isMobileDock ? effectiveDockState : undefined,
    handlers: isMobileDock
      ? {
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel,
        }
      : undefined,
    consumeSuppressedClick,
    revealIfTucked,
  }
}
