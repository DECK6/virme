import { useCallback, useMemo, useState } from 'react'
import { StyleGanLayer, type ModelLayerStatus } from './StyleGanLayer'
import { portraitAsset, visualStates } from './visualStates'
import './styles.css'

export default function App() {
  const state = visualStates[0]
  const [modelStatus, setModelStatus] = useState<ModelLayerStatus>({ status: 'loading', active: false })
  const [portraitVisible, setPortraitVisible] = useState(false)
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
        <a className="wordmark" href="#stage" aria-label="버추어미 잠재공간 MVP">
          <span className="mark" aria-hidden="true"><i /><i /><i /></span>
          <span>VIRTUEME</span>
        </a>
        <p>GENERATIVE LATENT STUDY <span>/</span> MVP 01</p>
        <div className="live-status"><i /> PORTRAIT {portraitVisible ? 'ON' : 'OFF'}</div>
      </header>

      <section className="workspace single-example" id="stage">
        <nav className="state-nav" aria-label="단일 시각 예시">
          <div className="eyebrow">SINGLE CONDITION</div>
          <h1>하나의<br />{' '}잠재 장면</h1>
          <p className="intro">하나의 잠재 풍경 안을 12초 동안 연속적으로 이동합니다.</p>
          <div className="reference-note">LUCID SONIC DREAMS · REAL STYLEGAN LATENT ROUTE</div>
          <div className="state-list">
            <div className="state-button active" aria-current="true">
              <span>01</span>
              <strong>{state.label}</strong>
              <small>{state.koLabel}</small>
            </div>
          </div>
          <button
            className={`portrait-toggle ${portraitVisible ? 'active' : ''}`}
            type="button"
            aria-pressed={portraitVisible}
            data-testid="portrait-toggle"
            onClick={() => setPortraitVisible((visible) => !visible)}
          >
            <span>PORTRAIT</span>
            <strong>{portraitVisible ? 'ON' : 'OFF'}</strong>
          </button>
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
          {portraitVisible && (
            <figure className="portrait-anchor" data-testid="portrait-anchor">
              <div className="portrait-aura" aria-hidden="true" />
              <img
                src={portraitAsset}
                alt="잠재 풍경 앞에 표시된 익명의 합성 인물 초상"
                data-testid="central-portrait"
              />
              <figcaption>
                <span>SUBJECT 01</span>
                <strong>PORTRAIT ON</strong>
              </figcaption>
            </figure>
          )}
          <div className="state-caption">
            <span>01 / 01</span>
            <div>
              <p>LATENT LANDSCAPE</p>
              <strong>잠재 장면</strong>
            </div>
          </div>
          <p className="state-description">하나의 잠재 풍경이 끊김 없이 변합니다. 초상은 선택적으로 겹쳐 볼 수 있습니다.</p>
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
