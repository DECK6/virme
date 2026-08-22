export const PERSONAL_DATA_EVENT = 'virtueme:personal-data'

export type PersonalDataPayload = {
  stability: number
  novelty: number
  conflict: number
  uncertainty: number
  possibility: number
  activity: number
  confidence: number
}

export type NormalizedPersonalData = {
  signals: number[]
  activity: number
  confidence: number
}

export type PersonalFeatures = NormalizedPersonalData & {
  change: number
}

const clamp = (value: unknown) => Math.max(0, Math.min(1, typeof value === 'number' && Number.isFinite(value) ? value : 0))

export const normalizePersonalData = (payload: PersonalDataPayload): NormalizedPersonalData => ({
  signals: [payload.stability, payload.novelty, payload.conflict, payload.uncertainty, payload.possibility].map(clamp),
  activity: clamp(payload.activity),
  confidence: clamp(payload.confidence),
})

export const derivePersonalFeatures = (current: NormalizedPersonalData, previous?: NormalizedPersonalData): PersonalFeatures => ({
  ...current,
  change: previous
    ? current.signals.reduce((sum, value, index) => sum + Math.abs(value - previous.signals[index]), 0) / current.signals.length
    : 0,
})

export const demoPersonalFeatures = (time: number, activeState: number): PersonalFeatures => {
  const signals = Array.from({ length: 5 }, (_, index) => {
    const distance = Math.abs(index - activeState)
    return Math.max(0.06, (index === activeState ? 0.82 : 0.2 / (distance + 1)) + Math.sin(time * 0.19 + index * 1.7) * 0.06)
  })
  return {
    signals,
    activity: 0.34 + Math.sin(time * 0.31) * 0.1,
    change: 0.18 + Math.sin(time * 0.23 + activeState) * 0.08,
    confidence: 0.72,
  }
}
