import { useEffect, useMemo, useRef, useState } from 'react'
import { demoPersonalFeatures, type PersonalFeatures } from './personalData'
import { buildStyleGanRequest, generateStyleGanFrame, getStyleGanHealth, type StyleGanHealth } from './styleGanClient'
import type { VisualStateId } from './visualStates'

const stateIndex: Record<VisualStateId, number> = {
  stability: 0,
  novelty: 1,
  conflict: 2,
  uncertainty: 3,
  'possible-self': 4,
}

const isStaticPublicBuild = import.meta.env.BASE_URL !== '/'

export type ModelLayerStatus = StyleGanHealth & { active: boolean }

export function StyleGanLayer({
  state,
  intensity,
  personalFeatures,
  enabled,
  onStatus,
}: {
  state: VisualStateId
  intensity: number
  personalFeatures: PersonalFeatures | null
  enabled: boolean
  onStatus: (status: ModelLayerStatus) => void
}) {
  const [health, setHealth] = useState<StyleGanHealth>({ status: 'loading' })
  const [currentFrame, setCurrentFrame] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const variation = useRef(0)
  const features = useMemo(
    () => personalFeatures ?? demoPersonalFeatures(stateIndex[state] * 1.7, stateIndex[state]),
    [personalFeatures, state],
  )

  useEffect(() => {
    if (!enabled || isStaticPublicBuild) {
      onStatus({ status: 'ready', backend: isStaticPublicBuild ? 'pre-rendered-video' : 'procedural-fallback', active: false })
      return
    }
    let cancelled = false
    getStyleGanHealth()
      .then((next) => {
        if (cancelled) return
        setHealth(next)
        onStatus({ ...next, active: next.status === 'ready' })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const next: StyleGanHealth = { status: 'error', detail: error instanceof Error ? error.message : 'offline' }
        setHealth(next)
        onStatus({ ...next, active: false })
      })
    return () => { cancelled = true }
  }, [enabled, onStatus])

  useEffect(() => {
    if (!enabled || health.status !== 'ready') return
    let cancelled = false
    const generate = async () => {
      try {
        const blob = await generateStyleGanFrame(buildStyleGanRequest(features, state, intensity, variation.current++))
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        setCurrentFrame((oldCurrent) => {
          if (oldCurrent) URL.revokeObjectURL(oldCurrent)
          return url
        })
        onStatus({ ...health, active: true })
      } catch (error) {
        if (!cancelled) onStatus({ status: 'error', active: false, detail: error instanceof Error ? error.message : 'generation failed' })
      }
    }
    void generate()
    return () => { cancelled = true }
  }, [enabled, features, health, intensity, onStatus, state])

  useEffect(() => () => {
    if (currentFrame) URL.revokeObjectURL(currentFrame)
  }, [currentFrame])

  return (
    <div
      className={`stylegan-field ${videoReady || currentFrame ? 'has-frame' : ''}`}
      data-testid="stylegan-layer"
      data-renderer="stylegan2-ada"
      data-model={health.model ?? 'unavailable'}
      data-device={health.device ?? 'unavailable'}
      data-render-mode={health.render_mode ?? 'unavailable'}
      data-display-mode="latent-loop-video"
      data-active={Boolean(enabled && (videoReady || currentFrame))}
      aria-hidden="true"
    >
      {enabled && (
        <video
          className="latent-loop-video"
          src={`${import.meta.env.BASE_URL}assets/latent-landscape-loop.mp4`}
          poster={currentFrame ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          data-testid="latent-loop-video"
          data-source="stylegan-latent-loop"
          data-effects="none"
          data-frame-count="144"
        />
      )}
    </div>
  )
}
