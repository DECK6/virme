import { describe, expect, it } from 'vitest'
import { createLucidState, stepLucidState } from '../src/lucidSonicController'
import { normalizePersonalData } from '../src/personalData'
import { getFlowOffset } from '../src/flowField'

describe('Lucid Sonic Dreams controller port', () => {
  it('normalizes only derived personal-state signals into the visual contract', () => {
    expect(normalizePersonalData({ stability: 2, novelty: -1, conflict: 0.4, uncertainty: 0.7, possibility: 0.9, activity: 0.6, confidence: 1.2 })).toEqual({
      signals: [1, 0, 0.4, 0.7, 0.9],
      activity: 0.6,
      confidence: 1,
    })
  })

  it('moves continuous field samples through a bounded latent curl field', () => {
    const first = getFlowOffset(0.2, 0.7, 0, 0.4, -0.3, 0.2, 0.8)
    const later = getFlowOffset(0.2, 0.7, 1.5, 0.4, -0.3, 0.2, 0.8)
    expect(later).not.toEqual(first)
    expect(Math.hypot(later.x, later.y)).toBeLessThanOrEqual(0.46)
  })
  it('smooths personal-data activity and accumulates state change into the latent vector', () => {
    const initial = createLucidState(4, 7)
    const next = stepLucidState(initial, { activity: 1, change: 0.5, signals: [0, 1, 0, 0, 0], confidence: 1 }, {
      activityReact: 0.5,
      changeReact: 0.5,
      changeRandomness: 0,
      truncation: 1,
    })

    expect(next.activity).toBeCloseTo(0.125)
    expect(next.change).toBeCloseTo(0.0625)
    expect(next.latent).not.toEqual(initial.latent)
  })

  it('keeps latent values inside the Lucid truncation boundary', () => {
    let current = createLucidState(8, 3)
    for (let frame = 0; frame < 500; frame += 1) {
      current = stepLucidState(current, { activity: 1, change: 1, signals: [0.2, 0.2, 0.2, 0.2, 0.2], confidence: 1 }, {
        activityReact: 1,
        changeReact: 1,
        changeRandomness: 0.25,
        truncation: 0.7,
      })
    }
    expect(Math.max(...current.latent.map(Math.abs))).toBeLessThanOrEqual(1.4)
  })
})
