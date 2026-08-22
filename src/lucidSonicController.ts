/**
 * Browser-side controller port inspired by Lucid Sonic Dreams (MIT):
 * https://github.com/mikael-alafriz-deel/lucid-sonic-dreams
 * Maps main.py generate_vectors/update_motion_signs/generate_class_vec concepts
 * to a personal-data-driven latent field; it does not bundle StyleGAN weights.
 */
import type { PersonalFeatures } from './personalData'

export type LucidConfig = {
  activityReact: number
  changeReact: number
  changeRandomness: number
  truncation: number
}

export type LucidState = {
  latent: number[]
  directions: number[]
  randomness: number[]
  activity: number
  change: number
  frame: number
  dominantSignal: number
  signalEnergy: number
}

const ACTIVITY_SMOOTH = 0.75
const CHANGE_SMOOTH = 0.75

const seeded = (index: number, seed: number) => {
  const value = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453
  return value - Math.floor(value)
}

export const normalizeSpectrum = (values: number[]) => {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const range = Math.max(...values) - min
  return range === 0 ? values.map(() => 0) : values.map((value) => (value - min) / range)
}

export const createLucidState = (size = 64, seed = 1): LucidState => ({
  latent: Array.from({ length: size }, (_, index) => (seeded(index, seed) * 2 - 1) * 0.35),
  directions: Array.from({ length: size }, (_, index) => (seeded(index, seed + 9) > 0.5 ? 1 : -1)),
  randomness: Array.from({ length: size }, (_, index) => seeded(index, seed + 19)),
  activity: 0,
  change: 0,
  frame: 0,
  dominantSignal: 0,
  signalEnergy: 0,
})

export const stepLucidState = (
  previous: LucidState,
  features: PersonalFeatures,
  config: LucidConfig,
): LucidState => {
  const activityTarget = features.activity * features.confidence * config.activityReact
  const changeTarget = features.change * config.changeReact
  const activity = previous.activity * ACTIVITY_SMOOTH + activityTarget * (1 - ACTIVITY_SMOOTH)
  const change = previous.change * CHANGE_SMOOTH + changeTarget * (1 - CHANGE_SMOOTH)
  const dominantSignal = features.signals.indexOf(Math.max(...features.signals))
  const signalEnergy = features.signals.reduce((sum, value, index) => sum + value * ((index + 1) / features.signals.length), 0) / 3
  const boundary = config.truncation * 2

  const directions = [...previous.directions]
  const latent = previous.latent.map((value, index) => {
    const randomFactor = 1 - config.changeRandomness * previous.randomness[index]
    const signalFactor = 1 + (features.signals[index % features.signals.length] || 0) * 0.22
    const next = value + activity * (index % 7 === 0 ? 0.08 : 0.018) + change * directions[index] * randomFactor * signalFactor
    if (next >= boundary) directions[index] = -1
    if (next <= -boundary) directions[index] = 1
    return Math.max(-boundary, Math.min(boundary, next))
  })

  return { ...previous, latent, directions, activity, change, frame: previous.frame + 1, dominantSignal, signalEnergy }
}
