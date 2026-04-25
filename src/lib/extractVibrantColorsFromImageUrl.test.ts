import { describe, expect, it } from 'vitest'

import { padStopsToFourColors, pickDiverseVibrantColors } from './extractVibrantColorsFromImageUrl'

describe('pickDiverseVibrantColors', () => {
  it('returns 2+ hex colors for a diverse set', () => {
    const pixels = [
      { r: 200, g: 20, b: 20 },
      { r: 20, g: 200, b: 20 },
      { r: 20, g: 40, b: 200 },
    ]
    const c = pickDiverseVibrantColors(pixels)
    expect(c).toBeTruthy()
    expect(c!.length).toBeGreaterThanOrEqual(2)
    for (const hex of c!) {
      expect(/^#[0-9a-f]{6}$/i.test(hex)).toBe(true)
    }
  })
})

describe('padStopsToFourColors', () => {
  it('pads two colors to four for looping gradients', () => {
    expect(padStopsToFourColors(['#ff0000', '#00ff00'])).toEqual(['#ff0000', '#00ff00', '#ff0000', '#00ff00'])
  })
})
