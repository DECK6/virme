import { useCallback, useMemo, useState } from 'react'
import { StyleGanLayer, type ModelLayerStatus } from './StyleGanLayer'
import { portraitAsset, visualStates } from './visualStates'
import './styles.css'

export default function App() {
  const state = visualStates[0]
  const [modelStatus, setModelStatus] = useState<ModelLayerStatus>({ status: 'loading', active: false })
  const handleModelStatus = useCallback((status: ModelLayerStatus) => setModelStatus(status), [])
  const backendLabel = modelStatus.active
    ? `${modelStatus.model ?? 'STYLEGAN2'} LATENT STRUCTURE · ${(modelStatus.device ?? 'MAC').toUpperCase()}`
    : modelStatus.status === 'loading'
      ? 'STYLEGAN2 · MAC LOADING'
      : 'STYLEGAN2 · VIDEO FALLBACK'

  const portraitStyle = useMemo(
    () =>
      ({
        '--portrait-opacity': state.portrait.opacity,
        '--portrait-scale': state.portrait.scale,
        '--portrait-contrast': state.portrait.contrast,
        '--portrait-saturate': state.portrait.saturate,
        '--state-color': state.color,
        '--state-accent': state.accent,
        '--dissolution': state.controls.dissolution,
        '--shear': state.controls.shear,
      }) as React.CSSProperties,
    [state],
  )

  return (
    <main className="app" style={{ '--state-color': state.color, '--state-accent': state.accent } as React.CSSProperties}>
      <header className="header">
        <a className="wordmark" href="#stage" aria-label="버추어미 생성 초상 MVP">
          <span className="mark" aria-hidden="true"><i /><i /><i /></span>
          <span>VIRTUEME</span>
        </a>
        <p>GENERATIVE PORTRAIT STUDY <span>/</span> MVP 01</p>
        <div className="live-status"><i /> PORTRAIT LOCKED</div>
      </header>

      <section className="workspace single-example" id="stage">
        <nav className="state-nav" aria-label="단일 시각 예시">
          <div className="eyebrow">SINGLE CONDITION</div>
          <h1>하나의 얼굴,<br />하나의 잠재 장면</h1>
          <p className="intro">한 사람과 하나의 잠재 풍경 사이를 12초 동안 연속적으로 이동합니다.</p>
          <div className="reference-note">LUCID SONIC DREAMS · REAL STYLEGAN LATENT ROUTE</div>
          <div className="state-list">
            <div className="state-button active" aria-current="true">
              <span>01</span>
              <strong>{state.label}</strong>
              <small>{state.koLabel}</small>
            </div>
          </div>
          <div className="single-example-meta">
            <span>LOOP</span><strong>12 SEC</strong>
            <span>MODEL</span><strong>STYLEGAN2</strong>
            <span>DISPLAY</span><strong>LATENT ONLY</strong>
          </div>
        </nav>

        <div
          className={`portrait-stage state-${state.id} route-stylegan`}
          style={portraitStyle}
          data-testid="portrait-stage"
          data-example-count="1"
        >
          <StyleGanLayer
            state={state.id}
            intensity={0.86}
            personalFeatures={null}
            enabled
            onStatus={handleModelStatus}
          />
          <figure className="portrait-anchor" data-testid="portrait-anchor">
            <div className="portrait-aura" aria-hidden="true" />
            <img
              src={portraitAsset}
              alt="잠재 풍경 앞에 고정된 익명의 합성 인물 초상"
              data-testid="central-portrait"
            />
            <figcaption>
              <span>SUBJECT 01</span>
              <strong>PORTRAIT CONSTANT</strong>
            </figcaption>
          </figure>
          <div className="state-caption">
            <span>01 / 01</span>
            <div>
              <p>LATENT LANDSCAPE</p>
              <strong>잠재 장면</strong>
            </div>
          </div>
          <p className="state-description">하나의 잠재 풍경이 끊김 없이 변하고, 초상은 장면의 기준점으로 남습니다.</p>
          <div className="model-chip">{backendLabel}</div>
        </div>
      </section>

      <footer className="transport single-transport">
        <div className="play-button loop-label"><span aria-hidden="true">▶</span>LATENT LOOP</div>
        <div className="timeline" aria-label="12초 잠재 루프">
          <button className="active" aria-label="단일 잠재 장면" disabled><i /></button>
        </div>
        <div className="clock">LOOP DURATION <strong>12 SEC</strong></div>
      </footer>
    </main>
  )
}
