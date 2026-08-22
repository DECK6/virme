export type VisualModeId = 'place' | 'object' | 'situation'

export type VisualMode = {
  id: VisualModeId
  index: string
  label: string
  koLabel: string
  subject: string
  description: string
  video: string
  model: 'STYLEGAN2' | 'STYLEGAN-XL'
  renderer: 'stylegan2-ada' | 'stylegan-xl'
  color: string
  accent: string
  classes: ReadonlyArray<{ index: number; label: string }>
}

export const visualModes: VisualMode[] = [
  {
    id: 'place',
    index: '01',
    label: 'PLACE',
    koLabel: '장소',
    subject: 'BUILDING FIXED',
    description: '현재 건물 잠재 분포 사이를 이동합니다. 장소 PoC의 기준 영상은 이 건물 루프로 고정합니다.',
    video: 'assets/latent-landscape-loop.mp4',
    model: 'STYLEGAN2',
    renderer: 'stylegan2-ada',
    color: '#66f2d2',
    accent: '#b9f67b',
    classes: [{ index: -1, label: 'LSUN CHURCH' }],
  },
  {
    id: 'object',
    index: '02',
    label: 'OBJECT',
    koLabel: '사물',
    subject: 'MULTI-CLASS OBJECTS',
    description: '가방·머그·의자·카메라·시계·컵의 클래스와 잠재벡터를 함께 보간해 여러 사물의 흔적을 순환합니다.',
    video: 'assets/latent-object-loop.mp4',
    model: 'STYLEGAN-XL',
    renderer: 'stylegan-xl',
    color: '#f0b56a',
    accent: '#ffe178',
    classes: [
      { index: 414, label: 'BACKPACK' },
      { index: 504, label: 'COFFEE MUG' },
      { index: 559, label: 'FOLDING CHAIR' },
      { index: 732, label: 'POLAROID CAMERA' },
      { index: 892, label: 'WALL CLOCK' },
      { index: 968, label: 'CUP' },
    ],
  },
  {
    id: 'situation',
    index: '03',
    label: 'SITUATION',
    koLabel: '상황',
    subject: 'MULTI-CLASS SCENES',
    description: '상점·도서관·식당·무대·해안처럼 사건이 생길 법한 장면 클래스 사이를 하나의 루프로 이동합니다.',
    video: 'assets/latent-situation-loop.mp4',
    model: 'STYLEGAN-XL',
    renderer: 'stylegan-xl',
    color: '#e68adf',
    accent: '#8fb8ff',
    classes: [
      { index: 424, label: 'BARBERSHOP' },
      { index: 454, label: 'BOOKSHOP' },
      { index: 582, label: 'GROCERY STORE' },
      { index: 624, label: 'LIBRARY' },
      { index: 762, label: 'RESTAURANT' },
      { index: 819, label: 'STAGE' },
      { index: 978, label: 'SEASHORE' },
    ],
  },
]
