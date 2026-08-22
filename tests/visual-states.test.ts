import { describe, expect, it } from 'vitest'
import { portraitAsset, visualStates } from '../src/visualStates'

describe('generative portrait visual contract', () => {
  it('keeps one optional portrait asset available in every visual state', () => {
    expect(portraitAsset).toBe('/assets/central-portrait.png')
    expect(visualStates.length).toBeGreaterThanOrEqual(5)

    for (const state of visualStates) {
      expect(state.portrait.visible).toBe(true)
      expect(state.portrait.opacity).toBeGreaterThanOrEqual(0.72)
      expect(state.portrait.scale).toBeGreaterThanOrEqual(0.92)
      expect(state.portrait.scale).toBeLessThanOrEqual(1.08)
    }
  })

  it('maps every state to bounded controller values', () => {
    for (const state of visualStates) {
      for (const value of Object.values(state.controls)) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('defines distinct stability, novelty, conflict, uncertainty, and possible-self states', () => {
    expect(visualStates.map((state) => state.id)).toEqual([
      'stability',
      'novelty',
      'conflict',
      'uncertainty',
      'possible-self',
    ])
  })
})
