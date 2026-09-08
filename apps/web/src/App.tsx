import DesktopDownloads from './DesktopDownloads'
import { t, language, setLanguage } from './i18n'
import { canUseWebGL } from './webgl'
import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Cpu,
  Layers3,
  Menu,
  Minus,
  Monitor,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Waves,
  X,
} from 'lucide-react'
import { products, faq } from './products'
import type { ProductId } from './products'
import Showcase, { MacPackageCards } from './Showcase'
import BrandVideo from './BrandVideo'
import RobotLab from './RobotLab'
type ConsultId = ProductId | 'mac' | 'mini' | 'macstudio' | 'macpro'
const macNames: Record<string, string> = {
  mac: 'H3 for Mac',
  mini: 'H3 Mini · Mac mini',
  macstudio: 'H3 Mac Studio',
  macpro: t('H3 Mac Pro · 보유 장비'),
}
const HardwareScene = lazy(() => import('./HardwareScene'))

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`wordmark ${light ? 'light' : ''}`} aria-label="H3">
      <span>H3</span>
      <i />
    </span>
  )
}
function Tower({ variant = 'studio' }: { variant?: string }) {
  return (
    <img
      className={`tower-art ${variant}`}
      src="/brand/product-nvidia.png"
      alt={`${variant} H3 ${language === 'ko' ? '컴퓨터 구성 컨셉' : 'computer configuration concept'}`}
      width={900}
      height={760}
    />
  )
}

/* lucide 1.x 는 브랜드 아이콘을 더 이상 제공하지 않는다.
   GitHub 로 연결하는 링크이므로 이용자가 바로 알아보는 마크를 직접 그린다. */
function GithubMark({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function StaticHardware() {
  return (
    <div className="static-hardware">
      <Tower />
      <span>H3 SYSTEM / CONCEPT</span>
    </div>
  )
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <StaticHardware /> : this.props.children
  }
}
function useReducedMotion() {
  const [reduced, set] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => set(m.matches)
    m.addEventListener('change', change)
    return () => m.removeEventListener('change', change)
  }, [])
  return reduced
}
function Contact({ selected, onClose }: { selected: ConsultId; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef(document.activeElement as HTMLElement | null)
  const [model, setModel] = useState<string>(selected),
    [purpose, setPurpose] = useState(t('콘텐츠 제작')),
    [team, setTeam] = useState(t('1명')),
    [note, setNote] = useState(''),
    [copied, setCopied] = useState(false),
    [emailOpened, setEmailOpened] = useState(false)
  const name = macNames[model] ?? products.find((p) => p.id === model)?.name ?? t('구성 미정')
  const brief =
    language === 'en'
      ? `H3 AI computer consultation\n\nConfiguration: ${name}\nWorkload: ${purpose}\nUsers: ${team}\nRequirements: ${note || 'To discuss'}\n\nPlease advise on hardware, model licenses, installation, support and a quote.`
      : `H3 AI 컴퓨터 구성 상담\n\n관심 구성: ${name}\n주요 작업: ${purpose}\n사용 인원: ${team}\n상세 요구사항: ${note || t('상담 시 논의')}\n\n최종 하드웨어, 모델 라이선스, 설치·지원 범위와 견적을 상담하고 싶습니다.`
  useEffect(() => {
    const el = dialog.current!
    el.showModal()
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = before
      el.close()
      requestAnimationFrame(() => {
        if (!el.isConnected) returnFocus.current?.focus()
      })
    }
  }, [])
  const download = () => {
    const url = URL.createObjectURL(new Blob([brief], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `H3-${model}-consultation.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <dialog
      ref={dialog}
      className="contact-dialog"
      aria-labelledby="contact-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose()
      }}
    >
      <div className="dialog-content">
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label={t('상담 창 닫기')}
        >
          <X />
        </button>
        <p className="eyebrow">LET'S BUILD YOUR H3</p>
        <h2 id="contact-title">
          {t('당신의 일부터')}
          <br />
          {t('들려주세요.')}
        </h2>
        <p className="dialog-intro">
          {t('구성안을 정리한 뒤 이메일로 상담을 이어갑니다.')}
          <br />
          {t('이 화면에서는 정보를 서버에 전송하지 않습니다.')}
        </p>
        <div className="dialog-fields">
          <label>
            {t('관심 있는 컴퓨터')}
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value)
                setCopied(false)
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.memory}GB GPU
                </option>
              ))}
              {Object.entries(macNames).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="field-pair">
            <label>
              {t('주요 작업')}
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option>{t('콘텐츠 제작')}</option>
                <option>{t('문서·업무 자동화')}</option>
                <option>{t('AI 개발·연구')}</option>
                <option>{t('팀 전용 AI 구축')}</option>
                <option>{t('상담 후 결정')}</option>
              </select>
            </label>
            <label>
              {t('사용 인원')}
              <select value={team} onChange={(e) => setTeam(e.target.value)}>
                <option>{t('1명')}</option>
                <option>{t('2–5명')}</option>
                <option>{t('6–20명')}</option>
                <option>{t('20명 이상')}</option>
              </select>
            </label>
          </div>
          <label>
            {t('만들고 싶은 것, 해결하고 싶은 일')}
            <textarea
              rows={3}
              maxLength={1500}
              placeholder={t('사용할 모델, 데이터 규모, 예산·일정 등 필요한 내용을 적어주세요.')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
        <a
          className="button primary wide"
          href={`mailto:hi@h3lab.kr?subject=${encodeURIComponent(`[H3 ${language === 'ko' ? '구성 상담' : 'consultation'}] ${name}`)}&body=${encodeURIComponent(brief)}`}
          onClick={() => setEmailOpened(true)}
        >
          {t('이메일로 상담 이어가기')}
          <ArrowUpRight size={18} />
        </a>
        <div className="dialog-actions">
          <button onClick={download}>
            <ArrowDownToLine size={16} />
            {t('구성안 저장')}
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(brief)
                setCopied(true)
              } catch {
                setCopied(false)
                download()
              }
            }}
          >
            {copied ? <Check size={16} /> : <Layers3 size={16} />}
            {copied ? t('복사됨') : t('요청 내용 복사')}
          </button>
        </div>
        <p className="contact-note" role="status">
          {emailOpened
            ? t(
                '메일 앱에서 내용을 확인한 뒤 보내주세요. 이 사이트에서 접수가 완료된 것은 아닙니다.',
              )
            : t('메일 앱이 연결되지 않았다면 내용을 복사해 hi@h3lab.kr로 보내주세요.')}
        </p>
      </div>
    </dialog>
  )
}
export default function App() {
  const staticView = new URLSearchParams(location.search).get('view') === 'static' || !canUseWebGL()
  const [menu, setMenu] = useState(false),
    // 히어로는 내부를 펼친 상태로 시작한다. 정적 대체 화면은 조립된 그림 한 장이라 제외한다.
    [exploded, setExploded] = useState(!staticView),
    [paused, setPaused] = useState(false),
    [sceneActive, setSceneActive] = useState(true),
    [comparison, setComparison] = useState(false),
    [contact, setContact] = useState<ConsultId | null>(null),
    [workflow, setWorkflow] = useState(0)
  const reduced = useReducedMotion(),
    hero = useRef<HTMLDivElement>(null),
    menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = hero.current
    if (!el) return
    let visible = true
    const sync = () => setSceneActive(visible && !document.hidden)
    const o = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    o.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => {
      o.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menu) {
        setMenu(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [menu])
  const workflows = [
    {
      title: t('업무의 맥락을 이해하는 대화.'),
      text: t(
        '문서 정리, 아이디어 탐색, 개발 보조까지. 내 작업에 맞는 언어 모델을 선택하고 중요한 판단은 사람이 확인합니다.',
      ),
      tag: 'LLM / KNOWLEDGE',
      prompt: t('이번 프로젝트의 핵심을 정리하고, 다음 할 일을 제안해줘.'),
      reply: t(
        '함께 정리해볼까요?\n\n01   목표와 우선순위 정리\n02   필요한 자료와 조건 확인\n03   실행할 작업으로 구체화',
      ),
      icon: <Terminal />,
    },
    {
      title: t('문장에, 나만의 목소리를.'),
      text: t(
        '내레이션과 안내 음성을 만들고, 발음과 음색을 확인합니다. 짧은 대사부터 작업 목적에 맞는 음성 환경을 구성합니다.',
      ),
      tag: 'VOICE / NARRATION',
      prompt: t('따뜻하고 또렷한 목소리로 읽어줘.'),
      reply: t('당신의 아이디어가\n세상에 닿을 수 있도록.\n\n음성 생성 → 청취 → 다듬기'),
      icon: <Waves />,
    },
    {
      title: t('생각을 눈앞의 이미지로.'),
      text: t(
        '제품과 브랜드의 장면을 시도하고 비교합니다. 이미지 모델과 편집 도구를 연결해 반복 가능한 제작 환경을 만듭니다.',
      ),
      tag: 'IMAGE / CREATIVE',
      prompt: t('아침 햇살이 비치는 공간의 제품 사진.'),
      reply: t(
        '주제 · 구도 · 빛 · 분위기\n\n원하는 장면을 구체화하고\n여러 결과 중 목적에 맞는 컷을 선택합니다.',
      ),
      icon: <Layers3 />,
    },
    {
      title: t('장면과 소리를, 하나의 흐름으로.'),
      text: t(
        '영상 생성과 검토·편집을 이어갑니다. 모델의 메모리와 실행 경로를 확인하고, 인물·움직임·한국어 대사를 함께 검토합니다.',
      ),
      tag: 'VIDEO / PRODUCTION',
      prompt: t('이 장면을 움직임과 대사가 있는 영상으로.'),
      reply: t('참조와 장면 설계\n→ 짧은 생성과 검토\n→ 선택한 컷으로 완성'),
      icon: <Play />,
    },
  ]
  return (
    <>
      <a className="skip-link" href="#main">
        {t('본문으로 건너뛰기')}
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label={t('H3 홈')}>
          <Wordmark />
          <span>{t('AI 컴퓨터')}</span>
        </a>
        <nav className={menu ? 'open' : ''} aria-label={t('주 메뉴')}>
          <a href="#systems" onClick={() => setMenu(false)}>
            {t('AI 컴퓨터')}
          </a>
          <a href="#showcase" onClick={() => setMenu(false)}>
            {t('쇼케이스')}
          </a>
          <a href="#robotics" onClick={() => setMenu(false)}>
            {t('로봇·업무 연결')}
          </a>
          <a href="#approach" onClick={() => setMenu(false)}>
            {t('도입 과정')}
          </a>
        </nav>
        <div className="language-switch" role="group" aria-label="Language / 언어">
          <button lang="ko" aria-pressed={language === 'ko'} onClick={() => setLanguage('ko')}>
            KO
          </button>
          <span>/</span>
          <button lang="en" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>
            EN
          </button>
        </div>
        <a
          className="header-github"
          href="https://github.com/H3Lab-kr/H3-AIComputer"
          target="_blank"
          rel="noreferrer"
          aria-label={t('GitHub 저장소 열기 (새 창)')}
          title="GitHub"
        >
          <GithubMark />
        </a>
        <button className="header-contact" onClick={() => setContact('studio')}>
          {t('나의 H3 구성하기')}
          <ArrowUpRight size={16} />
        </button>
        <button
          ref={menuButton}
          className="mobile-menu icon-button"
          aria-expanded={menu}
          aria-label={menu ? t('메뉴 닫기') : t('메뉴 열기')}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section id="top" className="hero" ref={hero}>
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              ENGINEERED FOR YOUR INTELLIGENCE
            </p>
            <p className="hero-brand-name">PERSONAL · CONNECTED · INTELLIGENCE</p>
            <h1>
              {t('H3 AI 컴퓨터')}
              <br />
              <span>
                {t('생각을 만들고,')}
                <br />
                {t('세상을 움직이다.')}
              </span>
            </h1>
            <p className="hero-description">
              {t('대화와 콘텐츠 제작부터 업무 도구와 연결된 장치까지.')}
              <br />
              {t('당신의 의도를 실제 작업으로 연결하는 AI 컴퓨터.')}
              <br />
              {t('당신의 가능성이 머무를 곳.')} <strong>H3.</strong>
            </p>
            <div className="hero-actions">
              <a className="button lime" href="#systems">
                {t('AI 컴퓨터 선택하기')}
                <ArrowRight size={18} />
              </a>
              <a className="text-link light-link" href="#robotics">
                {t('작동 방식 살펴보기')}
                <ArrowDown size={16} />
              </a>
            </div>
            <a className="hero-film-link" href="#brand-film">
              <Play size={13} /> {t('H3 브랜드 필름 · 30초')}
            </a>
            <div className="hero-proof">
              <span>{t('NVIDIA GPU 기반 구성')}</span>
              <i />
              <span>{t('목적에 맞춘 AI 환경')}</span>
            </div>
          </div>
          <div className={`hero-machine ${exploded ? 'exploded' : ''}`}>
            <div className="machine-caption">
              <span>H3 STUDIO</span>
              <span>DESIGN STUDY — 01</span>
            </div>
            <div className="scene-wrap" data-testid="hardware-scene">
              {staticView ? (
                <StaticHardware />
              ) : (
                <SceneBoundary>
                  <Suspense fallback={<StaticHardware />}>
                    <HardwareScene
                      exploded={exploded}
                      reduced={reduced}
                      paused={paused}
                      active={sceneActive}
                    />
                  </Suspense>
                </SceneBoundary>
              )}
            </div>
            <div className="machine-label label-gpu">
              <span>01 / GPU COMPUTE</span>
              <strong>
                {exploded ? t('작업을 움직이는 연산의 중심') : t('가능성을 만드는 코어')}
              </strong>
            </div>
            <div className="scene-controls">
              <button onClick={() => setExploded(!exploded)} aria-pressed={exploded}>
                {exploded ? <Minus size={15} /> : <Plus size={15} />}
                {exploded ? t('다시 조립하기') : t('내부 펼쳐보기')}
              </button>
              {!staticView && !reduced && (
                <button
                  className="motion-button"
                  onClick={() => setPaused(!paused)}
                  aria-pressed={paused}
                  aria-label={paused ? t('움직임 재생') : t('움직임 멈추기')}
                >
                  {paused ? <Play size={14} /> : <Pause size={14} />}
                </button>
              )}
              <span>{t('드래그하여 회전')}</span>
            </div>
            <p className="concept-note">
              {t(
                '시스템 구조를 표현한 컨셉입니다. 실제 외관·부품 수는 최종 구성에 따라 달라집니다.',
              )}
            </p>
          </div>
          <div className="hero-footer">
            <span>CREATE · ASSIST · CONNECT · CONTROL</span>
            <a href="#systems">
              EXPLORE THE SYSTEMS <ArrowDown size={13} />
            </a>
            <span>DESIGNED BY H3LAB</span>
          </div>
        </section>
        <RobotLab reduced={reduced} />
        <Showcase
          reduced={reduced}
          onConsult={(family) =>
            setContact(family === 'nvidia' ? 'studio' : family === 'studio' ? 'macstudio' : family)
          }
        />
        <BrandVideo />
        <section className="intro section-shell" id="engineering">
          <div className="section-index">01 — OUR PHILOSOPHY</div>
          <div className="intro-content">
            <h2>
              {t('좋은 부품을 넘어,')}
              <br />
              <span className="muted-word">{t('함께 잘 작동하는 시스템으로.')}</span>
            </h2>
            <p>
              {t('AI 컴퓨터는 GPU 하나로 완성되지 않습니다.')}
              <br />
              {t('모델이 머무는 메모리, 데이터를 읽는 저장 장치,')}
              <br className="desktop-only" />
              {t('오래 일할 수 있는 냉각과 전력. 그 위에 당신의 일을 담습니다.')}
            </p>
            <div className="engineering-grid">
              <article>
                <Cpu />
                <span>01 / COMPUTE</span>
                <h3>{t('작업에서 출발하는 연산')}</h3>
                <p>
                  {t('사용할 모델과 작업 크기에 맞춰')}
                  <br />
                  {t('GPU와 메모리 구성을 정합니다.')}
                </p>
              </article>
              <article>
                <Waves />
                <span>02 / BALANCE</span>
                <h3>{t('전체를 생각한 설계')}</h3>
                <p>
                  {t('전력·냉각·저장 공간까지.')}
                  <br />
                  {t('각 부품이 함께 일하도록 구성합니다.')}
                </p>
              </article>
              <article>
                <SlidersHorizontal />
                <span>03 / WORKFLOW</span>
                <h3>{t('사용할 수 있는 AI')}</h3>
                <p>
                  {t('설치에서 검토와 운영까지.')}
                  <br />
                  {t('도구를 당신의 작업 흐름에 연결합니다.')}
                </p>
              </article>
            </div>
          </div>
        </section>
        <section className="systems section-shell" id="systems">
          <div className="section-heading">
            <div>
              <p className="section-index">02 — FIND YOUR SYSTEM</p>
              <h2>{t('당신의 일에 맞는 H3.')}</h2>
            </div>
          </div>
          <div className="system-family" aria-labelledby="nvidia-family-title">
            <h3 className="system-family-title" id="nvidia-family-title">
              {t('NVIDIA 시스템')}
            </h3>
            <div className="product-grid">
              {products.map((p, i) => (
                <article
                  className={`product-card ${p.id === 'studio' ? 'featured' : ''}`}
                  key={p.id}
                >
                  <div className="product-topline">
                    <span>H3 / {String(i + 1).padStart(2, '0')}</span>
                    <span>
                      {p.id === 'studio'
                        ? 'CREATOR EDITION'
                        : p.id === 'core'
                          ? 'PERSONAL'
                          : 'PROFESSIONAL'}
                    </span>
                  </div>
                  <div className="product-visual">
                    <Tower variant={p.id} />
                    <span className="product-sku">{p.id.toUpperCase()}</span>
                  </div>
                  <div className="product-content">
                    <p className="product-use">{p.use}</p>
                    <h3>{p.name}</h3>
                    <p className="product-description">{p.descriptor}</p>
                    <div className="gpu-spec">
                      <strong>
                        {p.memory}
                        <small>GB</small>
                      </strong>
                      <span>
                        GPU MEMORY
                        <br />
                        {p.id === 'pro' ? 'GDDR7 · ECC' : 'GDDR7'}
                      </span>
                    </div>
                    <p className="gpu-name">NVIDIA {p.gpu}</p>
                    <div className="product-subspec">
                      <span>{p.ram} RAM</span>
                      <span>{p.storage}</span>
                    </div>
                    <ul>
                      {p.tasks.map((task) => (
                        <li key={task}>
                          <Check size={13} />
                          {task}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`button ${p.id === 'studio' ? 'primary' : 'outline'} wide`}
                      onClick={() => setContact(p.id)}
                    >
                      {p.name} {t('구성 상담')}
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="product-footnote">
              <p>
                {t(
                  '하드웨어 구성 제안입니다. CPU·전력·냉각·모델 호환성과 공급 상황을 확인한 뒤 최종 사양·견적을 확정합니다.',
                )}
              </p>
              <button
                className="text-link"
                aria-expanded={comparison}
                onClick={() => setComparison(!comparison)}
              >
                {comparison ? t('비교 접기') : t('세 모델 자세히 비교')}
                <ChevronDown size={16} className={comparison ? 'rotated' : ''} />
              </button>
            </div>
            {comparison && (
              <div className="comparison-wrap">
                <table>
                  <caption>{t('H3 NVIDIA 구성 제안 비교')}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t('설계 기준')}</th>
                      {products.map((p) => (
                        <th scope="col" key={p.id}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['GPU', ...products.map((p) => p.gpu)],
                      [
                        t('GPU 메모리'),
                        ...products.map((p) => `${p.memory}GB${p.id === 'pro' ? ' ECC' : ''}`),
                      ],
                      [t('시스템 메모리 제안'), ...products.map((p) => p.ram)],
                      [t('저장 장치 제안'), ...products.map((p) => p.storage)],
                      [t('도입 방식'), ...products.map((p) => p.status)],
                    ].map((row) => (
                      <tr key={row[0]}>
                        <th scope="row">{row[0]}</th>
                        {row.slice(1).map((v, i) => (
                          <td key={i}>{v}</td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <th scope="row">{t('GPU 공식 사양')}</th>
                      {products.map((p) => (
                        <td key={p.id}>
                          <a href={p.source} target="_blank" rel="noreferrer">
                            {t('NVIDIA 확인')}
                            <ArrowUpRight size={12} />
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p>
                  {t(
                    'GPU 사양 출처 확인: 2026.09.09. VRAM은 시스템 RAM과 다르며, 멀티 GPU에서 자동으로 합산되지 않습니다.',
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="system-family" aria-labelledby="mac-family-title">
            <h3 className="system-family-title" id="mac-family-title">
              {t('Mac 워크스페이스')}
            </h3>
            <MacPackageCards
              onConsult={(family) =>
                setContact(
                  family === 'studio' ? 'macstudio' : family === 'nvidia' ? 'studio' : family,
                )
              }
            />
            <div className="mac-panel">
              <div>
                <p className="eyebrow">H3 FOR MAC / PREVIEW 0.5.0</p>
                <h3>
                  {t('이미 가진 Mac에도,')}
                  <br />
                  {t('당신의 AI 작업 공간.')}
                </h3>
                <p>
                  {t(
                    'H3 Preview 0.5.0에서 AI에게 선택한 Mac 앱의 화면 읽기, 버튼 누르기, 텍스트 입력을 맡기세요. 로컬 브레인을 기본으로, 실행 전 확인과 한국어·영어 화면을 제공합니다.',
                  )}
                </p>
                <a className="button primary" href="/downloads/H3-Mac-0.5.0-preview.zip" download>
                  {t('Mac Preview 0.5.0 다운로드')} <ArrowUpRight size={16} />
                </a>
                <p className="mac-preview-note">
                  {t('Apple Silicon · macOS 14+ · 모델 별도 준비 · 개발자 Preview (공증 전)')}
                </p>
                <button className="button primary" onClick={() => setContact('mac')}>
                  {t('Mac 도입 상담')}
                  <ArrowUpRight size={16} />
                </button>
                <a
                  href="https://github.com/H3Lab-kr/H3-AIComputer"
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  {t('H3Lab 개발 프로젝트')}
                  <ArrowUpRight size={14} />
                </a>
              </div>
              <div className="mac-visual">
                <img
                  className="mac-app-screenshot"
                  src={language === 'en' ? '/brand/h3-mac-041-en.png' : '/brand/h3-mac-041-ko.png'}
                  alt={t('H3 Mac 앱 실제 화면 · 시작 준비와 생성 워크스페이스')}
                  loading="lazy"
                  width="1860"
                  height="1312"
                />
                <p>{t('실제 Mac 앱 화면 · Preview 0.4')}</p>
              </div>
            </div>
          </div>
        </section>
        <DesktopDownloads />
        <section className="workspace-section" id="workspace">
          <div className="section-shell">
            <div className="section-heading">
              <div>
                <p className="section-index">03 — HARDWARE MEETS INTELLIGENCE</p>
                <h2>
                  {t('컴퓨터를 켜고.')}
                  <br />
                  <span>{t('당신의 일에 집중하세요.')}</span>
                </h2>
              </div>
              <p>
                {t('다른 모델, 다른 도구.')}
                <br />
                {t('하나의 목적을 향해 연결합니다.')}
              </p>
            </div>
            <div className="workspace-grid">
              <div className="workflow-nav" role="group" aria-label={t('작업 활용 선택')}>
                {workflows.map((w, i) => (
                  <button key={w.tag} aria-pressed={workflow === i} onClick={() => setWorkflow(i)}>
                    <span className="workflow-number">0{i + 1}</span>
                    <span>
                      {w.icon}
                      <strong>
                        {
                          [
                            t('함께 생각하는 대화'),
                            t('목소리가 되는 문장'),
                            t('눈앞에 펼쳐지는 이미지'),
                            t('움직임을 만드는 영상'),
                          ][i]
                        }
                      </strong>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
              <div className="workspace-window">
                <div className="window-bar">
                  <div>
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>H3 WORKSPACE</span>
                  <Monitor size={13} />
                </div>
                <div className="window-main">
                  <div className="window-sidebar">
                    <Wordmark light />
                    <Terminal size={16} />
                    <Waves size={16} />
                    <Layers3 size={16} />
                    <Play size={16} />
                  </div>
                  <div className="window-chat">
                    <span className="window-tag">{workflows[workflow].tag}</span>
                    <div className="sample-prompt">{workflows[workflow].prompt}</div>
                    <div className="sample-response">
                      <span>H3</span>
                      <p>{workflows[workflow].reply}</p>
                    </div>
                    <div className="sample-input">
                      {t('당신의 다음 아이디어를 들려주세요.')}
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
                <span className="ui-concept-label">
                  {t('워크플로 인터페이스 예시 · 실제 AI 응답 아님')}
                </span>
              </div>
            </div>
            <div className="workflow-description">
              <h3>{workflows[workflow].title}</h3>
              <p>{workflows[workflow].text}</p>
            </div>
            <p className="workspace-status">
              {t(
                'Mac 앱 Preview에서 로컬 도구 연결을 개발·검증 중입니다. NVIDIA용 실행 환경은 구성별 검증 후 제안하며, 모든 모델의 실행을 일괄 보증하지 않습니다.',
              )}
            </p>
          </div>
        </section>
        <section className="approach section-shell" id="approach">
          <div className="section-heading">
            <div>
              <p className="section-index">04 — BUILT AROUND YOUR WORK</p>
              <h2>
                {t('박스 하나가 아닌,')}
                <br />
                {t('일할 준비가 된 환경을 위해.')}
              </h2>
            </div>
            <p>
              {t('필요한 일을 이해하는 것부터.')}
              <br />
              {t('H3의 설계는 여기서 시작합니다.')}
            </p>
          </div>
          <div className="process-grid">
            {[
              {
                n: '01',
                title: t('당신의 작업을 이해합니다'),
                text: t('목표 결과물, 모델, 데이터 규모와 사용 인원을 확인합니다.'),
              },
              {
                n: '02',
                title: t('맞는 구성을 설계합니다'),
                text: t('GPU·메모리·저장 공간과 전력·냉각, 설치 범위를 제안합니다.'),
              },
              {
                n: '03',
                title: t('실제 작업으로 확인합니다'),
                text: t('합의한 워크로드로 호환성과 품질·시간을 검증합니다.'),
              },
              {
                n: '04',
                title: t('운영의 기준을 남깁니다'),
                text: t('환경과 실행 기록, 업데이트·지원 범위를 함께 정리합니다.'),
              },
            ].map((x) => (
              <article key={x.n}>
                <span>{x.n}</span>
                <div className="process-line" />
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </article>
            ))}
          </div>
          <div className="promise">
            <ShieldCheck size={22} />
            <p>
              <strong>{t('측정한 것은 측정했다고. 검토할 것은 검토한다고.')}</strong>
              <br />
              {t('H3는 막연한 최고 성능보다, 당신의 작업에 맞는 근거를 쌓습니다.')}
            </p>
            <a href="https://github.com/H3Lab-kr/H3-AIComputer" target="_blank" rel="noreferrer">
              {t('개발 기록과 함께')}
              <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
        <section className="faq-section section-shell">
          <div>
            <p className="section-index">05 — A FEW GOOD QUESTIONS</p>
            <h2>
              {t('컴퓨터를 고르기 전,')}
              <br />
              {t('궁금한 것들.')}
            </h2>
          </div>
          <div className="faq-list">
            {faq.map(([q, a], i) => (
              <details key={q}>
                <summary>
                  <span>{q}</span>
                  <Plus size={17} />
                </summary>
                <p id={`faq-${i}`}>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing">
          <div className="closing-grid" aria-hidden="true" />
          <div className="section-shell closing-inner">
            <p className="eyebrow">YOUR NEXT POSSIBILITY STARTS HERE</p>
            <h2>
              {t('당신은 가능성을 생각하세요.')}
              <br />
              <span>{t('우리는 그 컴퓨터를 만듭니다.')}</span>
            </h2>
            <button className="button lime" onClick={() => setContact('studio')}>
              {t('나의 H3 함께 구성하기')}
              <ArrowUpRight size={18} />
            </button>
            <a href="mailto:hi@h3lab.kr">hi@h3lab.kr</a>
            <div className="closing-wordmark" aria-hidden="true">
              H3
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <a href="#top" aria-label={t('H3 맨 위로')}>
            <Wordmark />
          </a>
          <p>
            {t('하드웨어부터, 당신의 일까지.')}
            <br />
            <strong>{t('H3Lab · AI 컴퓨터를 설계합니다.')}</strong>
          </p>
          <div>
            <a href="#systems">{t('컴퓨터')}</a>
            <a href="#workspace">{t('워크스페이스')}</a>
            <a href="https://github.com/H3Lab-kr/H3-AIComputer" target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={12} />
            </a>
            <a href="mailto:hi@h3lab.kr">
              Contact <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 H3Lab.</span>
          <p>
            {t(
              'H3는 H3Lab의 제품 브랜드입니다. NVIDIA·Apple·MiniMax 및 모델명은 각 권리자의 자산이며 공식 제휴를 의미하지 않습니다. 현재 제품 구성은 상담 후 확정됩니다.',
            )}
          </p>
          <a href="#top">BACK TO TOP ↑</a>
        </div>
      </footer>
      {contact && <Contact selected={contact} onClose={() => setContact(null)} />}
    </>
  )
}
