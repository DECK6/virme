import { useEffect, useRef } from 'react'
import { getFlowOffset } from './flowField'
import { createLucidState, stepLucidState } from './lucidSonicController'
import { demoPersonalFeatures, type PersonalFeatures } from './personalData'
import type { VisualState, VisualStateId } from './visualStates'

const signalIndex: Record<VisualStateId, number> = {
  stability: 0,
  novelty: 1,
  conflict: 2,
  uncertainty: 3,
  'possible-self': 4,
}

const signalHues = [164, 57, 8, 224, 316]
const hash = (value: number) => {
  const result = Math.sin(value * 12.9898 + 78.233) * 43758.5453
  return result - Math.floor(result)
}

type GrowthAgent = {
  x: number
  y: number
  previousX: number
  previousY: number
  velocityX: number
  velocityY: number
  life: number
  maxLife: number
  generation: number
  signal: number
  seed: number
}

export function GenerativeField({ state, intensity, personalFeatures, onTelemetry }: {
  state: VisualState
  intensity: number
  personalFeatures: PersonalFeatures | null
  onTelemetry: (values: { activity: number; change: number; dominant: number; drift: number }) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state)
  const intensityRef = useRef(intensity)
  const personalRef = useRef(personalFeatures)
  const telemetryRef = useRef(onTelemetry)
  const lucidRef = useRef(createLucidState(64, 23))

  useEffect(() => {
    stateRef.current = state
    intensityRef.current = intensity
    personalRef.current = personalFeatures
    telemetryRef.current = onTelemetry
  }, [state, intensity, personalFeatures, onTelemetry])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const feedbackCanvas = document.createElement('canvas')
    const feedbackContext = feedbackCanvas.getContext('2d')
    const echoCanvas = document.createElement('canvas')
    const echoContext = echoCanvas.getContext('2d')
    if (!feedbackContext || !echoContext) return

    let width = 0
    let height = 0
    let frame = 0
    let animation = 0
    let agents: GrowthAgent[] = []

    const resetAgent = (agent: GrowthAgent, index: number, generation: number) => {
      const emitter = index % 13
      const phase = emitter * 2.39996 + generation * 0.031
      const radial = 0.08 + hash(index * 3.7 + generation) * 0.38
      const centerX = 0.5 + Math.cos(phase) * radial
      const centerY = 0.46 + Math.sin(phase * 0.83) * radial * 0.86
      const jitter = hash(index * 7.1 + generation * 1.9) - 0.5
      agent.x = (centerX + Math.cos(phase * 2.7) * jitter * 0.045) * feedbackCanvas.width
      agent.y = (centerY + Math.sin(phase * 2.1) * jitter * 0.045) * feedbackCanvas.height
      agent.previousX = agent.x
      agent.previousY = agent.y
      agent.velocityX = 0
      agent.velocityY = 0
      agent.life = 0
      agent.maxLife = 110 + Math.floor(hash(index * 5.3 + generation * 2.2) * 290)
      agent.generation = generation
      agent.signal = index % 5
      agent.seed = hash(index * 11.7 + generation * 0.37)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const feedbackScale = width < 620 ? 0.74 : 0.68
      feedbackCanvas.width = Math.max(320, Math.round(width * feedbackScale))
      feedbackCanvas.height = Math.max(420, Math.round(height * feedbackScale))
      echoCanvas.width = feedbackCanvas.width
      echoCanvas.height = feedbackCanvas.height
      feedbackContext.fillStyle = '#020308'
      feedbackContext.fillRect(0, 0, feedbackCanvas.width, feedbackCanvas.height)
      const count = width < 620 ? 680 : 1080
      agents = Array.from({ length: count }, (_, index) => {
        const agent = {} as GrowthAgent
        resetAgent(agent, index, Math.floor(index / 13))
        return agent
      })
    }

    const draw = () => {
      const current = stateRef.current
      const controls = current.controls
      const time = frame / 60
      const features = personalRef.current ?? demoPersonalFeatures(time, signalIndex[current.id])
      lucidRef.current = stepLucidState(lucidRef.current, features, {
        activityReact: 0.25 + controls.mass * 0.75,
        changeReact: 0.12 + controls.flow * 0.48,
        changeRandomness: controls.dissolution,
        truncation: 0.45 + controls.depth * 0.55,
      })
      const lucid = lucidRef.current
      const drift = lucid.latent.reduce((sum, value) => sum + Math.abs(value), 0) / lucid.latent.length
      if (frame % 8 === 0) telemetryRef.current({ activity: lucid.activity, change: lucid.change, dominant: lucid.dominantSignal, drift })

      echoContext.globalCompositeOperation = 'copy'
      echoContext.drawImage(feedbackCanvas, 0, 0)
      feedbackContext.globalCompositeOperation = 'source-over'
      feedbackContext.fillStyle = `rgba(2,3,8,${0.012 + controls.dissolution * 0.038 + features.signals[3] * 0.014})`
      feedbackContext.fillRect(0, 0, feedbackCanvas.width, feedbackCanvas.height)
      feedbackContext.save()
      feedbackContext.translate(feedbackCanvas.width / 2, feedbackCanvas.height / 2)
      feedbackContext.rotate(lucid.latent[0] * 0.00045)
      const feedbackScale = 1.0003 + lucid.activity * 0.0009
      feedbackContext.scale(feedbackScale, feedbackScale)
      feedbackContext.globalAlpha = 0.972 - controls.dissolution * 0.018
      feedbackContext.drawImage(echoCanvas, -feedbackCanvas.width / 2, -feedbackCanvas.height / 2)
      feedbackContext.restore()

      const paths = Array.from({ length: 5 }, () => new Path2D())
      const activeCount = Math.floor(agents.length * (0.55 + features.activity * 0.27 + controls.branching * 0.18))
      for (let index = 0; index < activeCount; index += 1) {
        const agent = agents[index]
        agent.previousX = agent.x
        agent.previousY = agent.y
        const xNorm = agent.x / feedbackCanvas.width
        const yNorm = agent.y / feedbackCanvas.height
        const latentA = lucid.latent[index % lucid.latent.length]
        const latentB = lucid.latent[(index + 19) % lucid.latent.length]
        const flow = getFlowOffset(xNorm, yNorm, time + agent.seed * 3, latentA, latentB, lucid.change, controls.flow)
        const branch = Math.sin(agent.life * (0.025 + controls.branching * 0.055) + agent.seed * Math.PI * 8) * controls.branching
        const angle = Math.atan2(flow.y, flow.x) + branch * 0.74 + lucid.latent[(index + 31) % 64] * controls.shear * 0.42
        const speed = 0.22 + lucid.activity * 1.4 + lucid.change * 1.8 + features.signals[agent.signal] * 0.52
        agent.velocityX = agent.velocityX * (0.84 + controls.viscosity * 0.1) + Math.cos(angle) * speed * 0.18
        agent.velocityY = agent.velocityY * (0.84 + controls.viscosity * 0.1) + Math.sin(angle) * speed * 0.18
        agent.x += agent.velocityX
        agent.y += agent.velocityY
        agent.life += 1
        paths[agent.signal].moveTo(agent.previousX, agent.previousY)
        paths[agent.signal].lineTo(agent.x, agent.y)

        const escaped = agent.x < -20 || agent.x > feedbackCanvas.width + 20 || agent.y < -20 || agent.y > feedbackCanvas.height + 20
        if (agent.life > agent.maxLife || escaped) resetAgent(agent, index, agent.generation + 1)
      }

      feedbackContext.save()
      feedbackContext.globalCompositeOperation = 'screen'
      feedbackContext.lineCap = 'round'
      feedbackContext.lineJoin = 'round'
      feedbackContext.shadowBlur = 5 + controls.afterglow * 18
      for (let signal = 0; signal < paths.length; signal += 1) {
        const signalStrength = features.signals[signal]
        const hue = signalHues[lucid.dominantSignal] + signal * 31 + lucid.latent[signal * 7] * 38
        feedbackContext.lineWidth = 0.42 + signalStrength * 1.7 + controls.branching * 0.45
        feedbackContext.strokeStyle = `hsla(${hue},${64 + features.confidence * 25}%,${46 + signalStrength * 22}%,${0.075 + signalStrength * 0.15})`
        feedbackContext.shadowColor = `hsla(${hue},90%,62%,${0.24 + controls.afterglow * 0.3})`
        feedbackContext.stroke(paths[signal])
      }
      feedbackContext.restore()

      if (frame % 3 === 0) {
        feedbackContext.save()
        feedbackContext.globalCompositeOperation = 'screen'
        for (let emitter = 0; emitter < 7; emitter += 1) {
          const phase = time * (0.035 + lucid.change * 0.04) + emitter * 2.39996
          const centerX = (0.5 + Math.cos(phase) * (0.12 + emitter * 0.035)) * feedbackCanvas.width
          const centerY = (0.46 + Math.sin(phase * 1.13) * (0.1 + emitter * 0.026)) * feedbackCanvas.height
          const radius = 10 + features.signals[emitter % 5] * 34 + lucid.activity * 24
          const glow = feedbackContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
          const hue = signalHues[lucid.dominantSignal] + emitter * 27
          glow.addColorStop(0, `hsla(${hue},92%,64%,${0.035 + lucid.activity * 0.045})`)
          glow.addColorStop(1, `hsla(${hue},90%,40%,0)`)
          feedbackContext.fillStyle = glow
          feedbackContext.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2)
        }
        feedbackContext.restore()
      }

      context.fillStyle = '#020308'
      context.fillRect(0, 0, width, height)
      context.save()
      context.globalCompositeOperation = 'screen'
      context.globalAlpha = 0.72
      context.filter = `blur(${8 + controls.afterglow * 12}px) saturate(${1.35 + intensityRef.current * 0.7})`
      context.drawImage(feedbackCanvas, -10, -10, width + 20, height + 20)
      context.restore()
      context.save()
      context.globalCompositeOperation = 'screen'
      context.globalAlpha = 0.9
      context.filter = `blur(${0.45 + controls.dissolution * 1.8}px) saturate(${1.1 + controls.afterglow * 0.5}) contrast(1.15)`
      context.drawImage(feedbackCanvas, 0, 0, width, height)
      context.restore()

      const vignette = context.createRadialGradient(width / 2, height * 0.76, 0, width / 2, height * 0.76, Math.min(width, height) * 0.54)
      vignette.addColorStop(0, 'rgba(2,3,8,.16)')
      vignette.addColorStop(0.5, 'rgba(2,3,8,.02)')
      vignette.addColorStop(1, 'rgba(2,3,8,.5)')
      context.fillStyle = vignette
      context.fillRect(0, 0, width, height)
      frame += 1
      animation = requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    animation = requestAnimationFrame(draw)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animation)
    }
  }, [])

  return <canvas ref={canvasRef} className="generative-field model-frame-field" data-model-keyframes="0" data-renderer="generative-feedback" data-emergence="growth-branch-dissolve" data-feedback="accumulative" data-geometry="none" data-input-source="personal-data" data-direct-image="false" data-flow-field="latent-curl" aria-hidden="true" />
}
