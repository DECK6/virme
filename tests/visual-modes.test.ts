import { describe, expect, it } from 'vitest'
import { visualModes } from '../src/visualModes'

describe('three-mode latent loop contract', () => {
  it('defines place, object, and situation in a stable order', () => {
    expect(visualModes.map((mode) => mode.id)).toEqual(['place', 'object', 'situation'])
  })

  it('keeps place fixed to the current building loop', () => {
    expect(visualModes[0]).toMatchObject({
      id: 'place',
      subject: 'BUILDING FIXED',
      video: 'assets/latent-landscape-loop.mp4',
    })
  })

  it('uses distinct multi-class videos for objects and situations', () => {
    expect(visualModes[1]).toMatchObject({
      subject: 'MULTI-CLASS OBJECTS',
      video: 'assets/latent-object-loop.mp4',
    })
    expect(visualModes[2]).toMatchObject({
      subject: 'MULTI-CLASS SCENES',
      video: 'assets/latent-situation-loop.mp4',
    })
    expect(new Set(visualModes.map((mode) => mode.video)).size).toBe(3)
    expect(visualModes[1].classes.length).toBeGreaterThanOrEqual(5)
    expect(visualModes[2].classes.length).toBeGreaterThanOrEqual(5)
  })
})
