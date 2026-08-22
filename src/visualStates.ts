export type VisualStateId = 'stability' | 'novelty' | 'conflict' | 'uncertainty' | 'possible-self'

export type VisualControls = {
  mass: number
  flow: number
  viscosity: number
  shear: number
  dissolution: number
  branching: number
  depth: number
  afterglow: number
}

export type VisualState = {
  id: VisualStateId
  index: string
  label: string
  koLabel: string
  description: string
  color: string
  accent: string
  portrait: {
    visible: true
    opacity: number
    scale: number
    contrast: number
    saturate: number
  }
  controls: VisualControls
}

export const portraitAsset = `${import.meta.env.BASE_URL}assets/central-portrait.png`

export const visualStates: VisualState[] = [
  {
    id: 'stability',
    index: '01',
    label: 'STABILITY',
    koLabel: '안정',
    description: '무거운 장과 긴 호흡. 초상은 가장 선명한 기준점으로 남습니다.',
    color: '#66f2d2',
    accent: '#b9f67b',
    portrait: { visible: true, opacity: 0.98, scale: 1, contrast: 1.03, saturate: 0.84 },
    controls: { mass: 0.88, flow: 0.16, viscosity: 0.9, shear: 0.08, dissolution: 0.04, branching: 0.12, depth: 0.68, afterglow: 0.34 },
  },
  {
    id: 'novelty',
    index: '02',
    label: 'NOVELTY',
    koLabel: '새로움',
    description: '개인 데이터의 새로운 경향이 색과 분기로 번지며 다른 가능성을 만듭니다.',
    color: '#f4f064',
    accent: '#ff8a45',
    portrait: { visible: true, opacity: 0.94, scale: 1.01, contrast: 1.08, saturate: 1.08 },
    controls: { mass: 0.46, flow: 0.61, viscosity: 0.32, shear: 0.2, dissolution: 0.08, branching: 0.94, depth: 0.74, afterglow: 0.78 },
  },
  {
    id: 'conflict',
    index: '03',
    label: 'CONFLICT',
    koLabel: '충돌',
    description: '서로 다른 흐름이 교차하고 전단되지만 중앙 인물은 끊기지 않습니다.',
    color: '#ff624f',
    accent: '#8c6bff',
    portrait: { visible: true, opacity: 0.9, scale: 0.99, contrast: 1.18, saturate: 0.9 },
    controls: { mass: 0.58, flow: 0.88, viscosity: 0.18, shear: 0.96, dissolution: 0.22, branching: 0.52, depth: 0.84, afterglow: 0.66 },
  },
  {
    id: 'uncertainty',
    index: '04',
    label: 'UNCERTAINTY',
    koLabel: '불확실성',
    description: '주변 경계는 해체되지만 얼굴은 식별 가능한 최소 선명도를 유지합니다.',
    color: '#aeb9c8',
    accent: '#6f80ff',
    portrait: { visible: true, opacity: 0.76, scale: 1.02, contrast: 0.93, saturate: 0.46 },
    controls: { mass: 0.28, flow: 0.38, viscosity: 0.54, shear: 0.3, dissolution: 0.92, branching: 0.2, depth: 0.42, afterglow: 0.82 },
  },
  {
    id: 'possible-self',
    index: '05',
    label: 'POSSIBLE SELF',
    koLabel: '가능한 나',
    description: '현재 초상 위에 다른 시간대의 잔상이 공존합니다. 본체는 언제나 중앙에 남습니다.',
    color: '#ff67ca',
    accent: '#63e8ff',
    portrait: { visible: true, opacity: 0.92, scale: 1.04, contrast: 1.06, saturate: 1.12 },
    controls: { mass: 0.66, flow: 0.7, viscosity: 0.4, shear: 0.44, dissolution: 0.18, branching: 0.76, depth: 0.98, afterglow: 0.92 },
  },
]
