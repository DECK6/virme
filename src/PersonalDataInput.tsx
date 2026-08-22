import { useEffect, useRef, useState } from 'react'
import {
  PERSONAL_DATA_EVENT,
  derivePersonalFeatures,
  normalizePersonalData,
  type NormalizedPersonalData,
  type PersonalDataPayload,
  type PersonalFeatures,
} from './personalData'

export function PersonalDataInput({ onFeatures }: { onFeatures: (features: PersonalFeatures | null) => void }) {
  const previousRef = useRef<NormalizedPersonalData | undefined>(undefined)
  const [source, setSource] = useState('ANONYMOUS DEMO PROFILE')

  const ingest = (payload: PersonalDataPayload, sourceName: string) => {
    const normalized = normalizePersonalData(payload)
    onFeatures(derivePersonalFeatures(normalized, previousRef.current))
    previousRef.current = normalized
    setSource(sourceName)
  }

  useEffect(() => {
    const handleIncoming = (event: Event) => ingest((event as CustomEvent<PersonalDataPayload>).detail, 'LIVE PERSONAL DATA')
    window.addEventListener(PERSONAL_DATA_EVENT, handleIncoming)
    return () => window.removeEventListener(PERSONAL_DATA_EVENT, handleIncoming)
  })

  const loadJson = async (file?: File) => {
    if (!file) {
      previousRef.current = undefined
      onFeatures(null)
      setSource('ANONYMOUS DEMO PROFILE')
      return
    }
    ingest(JSON.parse(await file.text()) as PersonalDataPayload, file.name.toUpperCase())
  }

  return (
    <div className="personal-data-input">
      <span>PERSONAL DATA FEED</span>
      <label>
        <strong>{source}</strong>
        <input type="file" accept="application/json,.json" aria-label="개인 데이터 JSON 불러오기" onChange={(event) => void loadJson(event.target.files?.[0])} />
      </label>
      <small>DERIVED SIGNALS ONLY · RAW DATA NOT RENDERED</small>
    </div>
  )
}
