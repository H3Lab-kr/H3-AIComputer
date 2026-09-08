import { t } from './i18n'
import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  Camera,
  Check,
  Cpu,
  FileImage,
  Pause,
  Play,
  RotateCcw,
  Scan,
  ShieldCheck,
} from 'lucide-react'
import { canUseWebGL } from './webgl'
import './robot.css'
const Scene = lazy(() => import('./RobotScene'))
const steps = [t('요청 이해'), t('실행 승인'), t('제품 이동'), t('촬영 확인'), t('콘텐츠 구성')]
function FlatCell({ step }: { step: number }) {
  return (
    <div className="cell-fallback">
      <Cpu size={65} />
      <span>{t('H3 AI 컴퓨터')}</span>
      <ArrowRight />
      <div>
        <Scan size={58} />
        <strong>{t('로봇 작업 셀')}</strong>
      </div>
      <p>
        {steps[step]} {t('· 시뮬레이션')}
      </p>
    </div>
  )
}
class Boundary extends Component<{ children: ReactNode; step: number }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <FlatCell step={this.props.step} /> : this.props.children
  }
}
export default function RobotLab({ reduced }: { reduced: boolean }) {
  const [mode, setMode] = useState<
      'idle' | 'planning' | 'approval' | 'running' | 'paused' | 'complete'
    >('idle'),
    [progress, setProgress] = useState(0),
    [active, setActive] = useState(false)
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    let visible = false
    const sync = () => setActive(visible && !document.hidden)
    const o = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      sync()
    })
    if (root.current) o.observe(root.current)
    document.addEventListener('visibilitychange', sync)
    return () => {
      o.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  useEffect(() => {
    if (mode === 'planning') {
      const id = setTimeout(() => setMode('approval'), 900)
      return () => clearTimeout(id)
    }
  }, [mode])
  useEffect(() => {
    if (mode !== 'running' || !active) return
    const id = setInterval(() => setProgress((p) => Math.min(1, p + 0.006)), 50)
    return () => clearInterval(id)
  }, [mode, active])
  useEffect(() => {
    if (progress >= 1 && mode === 'running') setMode('complete')
  }, [progress, mode])
  const step =
    mode === 'idle' || mode === 'planning'
      ? 0
      : mode === 'approval'
        ? 1
        : progress < 0.72
          ? 2
          : progress < 0.88
            ? 3
            : 4
  const status =
    mode === 'idle'
      ? t('요청 대기')
      : mode === 'planning'
        ? t('작업 순서를 구성합니다')
        : mode === 'approval'
          ? t('실행 승인을 기다립니다')
          : mode === 'paused'
            ? t('시연 일시 정지')
            : mode === 'complete'
              ? t('시연 완료')
              : steps[step]
  const staticView = new URLSearchParams(location.search).get('view') === 'static' || !canUseWebGL()
  const displayProgress = reduced ? (step < 2 ? 0 : step === 2 ? 0.45 : 1) : progress
  return (
    <section ref={root} id="robotics" className="robot-lab">
      <div className="robot-heading">
        <div>
          <p className="eyebrow">H3 AI COMPUTER / CONNECTED INTELLIGENCE</p>
          <h2>
            {t('만들고. 돕고.')}
            <br />
            <span>{t('연결하고, 움직입니다.')}</span>
          </h2>
        </div>
        <p>
          {t('하드웨어와 소프트웨어의 중심에, AI 컴퓨터.')}
          <br />
          {t('당신의 요청이 실제 작업으로 이어지는 구조를 경험하세요.')}
        </p>
      </div>
      <div className="control-architecture">
        <div>
          <Cpu />
          <strong>{t('H3 AI 컴퓨터')}</strong>
          <span>{t('이해 · 계획 · 권한 · 기록')}</span>
        </div>
        <ArrowRight className="architecture-arrow" />
        <div className="architecture-targets">
          <div>
            <FileImage />
            <strong>{t('소프트웨어')}</strong>
            <span>{t('대화 · 음성 · 이미지 · 영상')}</span>
          </div>
          <div>
            <Scan />
            <strong>{t('장치 연결 · 현장 제어기')}</strong>
            <span>{t('명령 전달 · 동작 · 안전 제한')}</span>
          </div>
        </div>
      </div>
      <div className="robot-console">
        <div className="console-top">
          <span>
            <i /> H3 CONTROL / ROBOTICS LAB
          </span>
          <b>{t('시뮬레이션 · 실제 장치 연결 없음')}</b>
        </div>
        <div className="console-body">
          <div className="robot-viewport">
            {staticView ? (
              <FlatCell step={step} />
            ) : (
              <Boundary step={step}>
                <Suspense fallback={<FlatCell step={step} />}>
                  <Scene progress={displayProgress} active={active} reduced={reduced} />
                </Suspense>
              </Boundary>
            )}
            <div className="cell-label">
              <Camera size={13} /> CAMERA / PICK & PLACE
            </div>
            <div className="cell-legend">
              <span>{t('● 인식·이동 경로')}</span>
              <span>{t('● H3 명령 연결')}</span>
            </div>
            <div className="cell-coordinates">
              CELL 01 / CONCEPT GEOMETRY
              <br />
              {t('좌표·경로는 시연용 설계입니다.')}
            </div>
          </div>
          <div className="task-panel">
            <p className="eyebrow">TRY A TASK</p>
            <h3>{t('제품 촬영 도우미')}</h3>
            <blockquote>
              {t('“이 제품을 촬영하고')}
              <br />
              {t('소개 자료를 만들어줘.”')}
            </blockquote>
            <ol>
              {steps.map((label, i) => (
                <li key={label} className={i === step ? 'current' : i < step ? 'done' : ''}>
                  <span>{i < step ? <Check size={12} /> : String(i + 1).padStart(2, '0')}</span>
                  {label}
                </li>
              ))}
            </ol>
            <p className="task-status" role="status">
              {status}
            </p>
            <div className="task-actions">
              {mode === 'idle' ? (
                <button className="button gold" onClick={() => setMode('planning')}>
                  <Play size={15} />
                  {t('작업 시연 시작')}
                </button>
              ) : mode === 'approval' ? (
                <button className="button gold" onClick={() => setMode('running')}>
                  <ShieldCheck size={16} />
                  {t('시뮬레이션 실행 승인')}
                </button>
              ) : mode === 'running' || mode === 'paused' ? (
                <button
                  className="button gold"
                  onClick={() => setMode(mode === 'running' ? 'paused' : 'running')}
                >
                  {mode === 'running' ? <Pause size={16} /> : <Play size={16} />}{' '}
                  {mode === 'running' ? t('시연 일시 정지') : t('시연 계속하기')}
                </button>
              ) : mode === 'planning' ? (
                <button className="button gold" disabled>
                  {t('작업 계획 구성 중')}
                </button>
              ) : (
                <span className="simulation-finished">
                  <Check size={16} /> {t('흐름 확인 완료')}
                </span>
              )}
              {mode !== 'idle' && (
                <button
                  className="reset-simulation"
                  aria-label={t('시연 초기화')}
                  onClick={() => {
                    setMode('idle')
                    setProgress(0)
                  }}
                >
                  <RotateCcw size={17} />
                </button>
              )}
            </div>
            <p className="approval-note">
              {t('이 승인은 화면 속 시연만 진행합니다.')}
              <br />
              {t('실제 제어 연결·명령 전송은 수행하지 않습니다.')}
            </p>
          </div>
        </div>
        {mode === 'complete' && (
          <div className="simulation-result">
            <FileImage />
            <div>
              <strong>{t('장치의 행동에서, 디지털 결과물까지.')}</strong>
              <p>
                {t(
                  '제품 이동 → 촬영 확인 → 소개 자료 구성. 이 화면은 연결 흐름의 예시이며 실제 촬영·AI 생성 결과가 아닙니다.',
                )}
              </p>
            </div>
            <span>WORKFLOW PREVIEW</span>
          </div>
        )}
      </div>
      <div className="robot-boundaries">
        <p>
          <strong>{t('지금의 H3')}</strong> {t('로컬 모델과 생성 도구를 연결하는 Mac 앱 Preview.')}
        </p>
        <p>
          <strong>{t('확장하는 H3')}</strong>{' '}
          {t('업무 비서·카메라·로봇 연동은 장치별 검증을 거쳐 구축할 영역.')}
        </p>
        <p>
          <strong>{t('제어의 역할')}</strong>{' '}
          {t('H3는 작업 계획과 상태를 조율하고, 현장 제어기가 동작·안전 제한을 담당합니다.')}
        </p>
      </div>
    </section>
  )
}
