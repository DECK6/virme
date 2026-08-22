export type ExperienceModeId = 'novel' | 'talk' | 'visual'

export type ExperienceMode = {
  id: ExperienceModeId
  index: string
  label: string
  koLabel: string
  description: string
  document?: string
}

export const experienceModes: ExperienceMode[] = [
  {
    id: 'novel',
    index: '01',
    label: 'NOVEL',
    koLabel: '노벨',
    description: '기록에서 이야기를 짓습니다.',
    document: 'storyseed-novel.html',
  },
  {
    id: 'talk',
    index: '02',
    label: 'TALK',
    koLabel: '채팅',
    description: '기록 속의 나와 대화합니다.',
    document: 'storyseed-talk.html',
  },
  {
    id: 'visual',
    index: '03',
    label: 'VISUAL',
    koLabel: '비주얼',
    description: '기록의 잠재공간을 봅니다.',
  },
]
