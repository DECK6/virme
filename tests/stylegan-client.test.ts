import { describe, expect, it } from 'vitest'
import { buildStyleGanRequest } from '../src/styleGanClient'

describe('buildStyleGanRequest', () => {
  it('maps personal features to a deterministic bounded model request', () => {
    const request = buildStyleGanRequest({
      signals: [0.2, 0.8, 0.1, 0.5, 0.3],
      activity: 0.7,
      change: 0.4,
      confidence: 0.9,
    }, 'novelty', 0.86)

    expect(request.signals).toEqual([0.2, 0.8, 0.1, 0.5, 0.3])
    expect(request.seed).toBe(609348)
    expect(request.truncation).toBeCloseTo(0.718)
    expect(request.state).toBe('novelty')
  })

  it('clamps malformed feature values before they reach the model service', () => {
    const request = buildStyleGanRequest({
      signals: [-2, 3, Number.NaN, 0.5, 0.3],
      activity: 2,
      change: -1,
      confidence: 5,
    }, 'stability', 5)

    expect(request.signals).toEqual([0, 1, 0, 0.5, 0.3])
    expect(request.activity).toBe(1)
    expect(request.change).toBe(0)
    expect(request.truncation).toBeLessThanOrEqual(1)
  })
})
