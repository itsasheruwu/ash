export function readTransitionMs(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name)
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function modalCloseMs(): number {
  return readTransitionMs('--modal-close-dur', 150)
}
