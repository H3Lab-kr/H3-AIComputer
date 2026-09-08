import { t } from './i18n'
import { canUseWebGL } from './webgl'
import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight, Pause, Play, Rotate3D } from 'lucide-react'
import type { Family } from './ProductModels'
const Scene = lazy(() => import('./ShowroomScene'))
const families = [
  {
    id: 'nvidia' as Family,
    label: 'NVIDIA RTX',
    name: 'H3 Performance',
    line: t('가능성을 확장하는 힘.'),
    detail: t(
      'Core · Studio · Pro. 모델과 업무에 맞춰 GPU, 메모리, 전력과 냉각을 함께 설계하는 AI 컴퓨터.',
    ),
    tag: 'PURPOSE-BUILT WORKSTATION',
    spec: '16 / 32 / 96GB',
    unit: 'GPU MEMORY OPTIONS',
    note: t('하드웨어 구성 제안 · 최종 사양 별도 확정'),
  },
  {
    id: 'mini' as Family,
    label: 'Mac mini',
    name: 'H3 Mini',
    line: t('작은 공간. 넓은 가능성.'),
    detail: t(
      '책상 위 작은 AI 작업실. Mac mini에 개인 업무와 음성·이미지 도구를 연결하는 H3 환경을 구성합니다.',
    ),
    tag: 'PERSONAL AI PACKAGE',
    spec: 'COMPACT',
    unit: 'APPLE SILICON · H3 WORKSPACE',
    note: t('Apple 하드웨어 + H3 환경 구성 제안'),
  },
  {
    id: 'studio' as Family,
    label: 'Mac Studio',
    name: 'H3 Mac Studio',
    line: t('창작의 중심이 되는 컴퓨터.'),
    detail: t(
      '기존 H3Lab의 로컬 AI 제작 경험을 잇는 패키지. 대화부터 이미지와 영상까지, 작업에 맞는 메모리와 실행 도구를 선택합니다.',
    ),
    tag: 'CREATIVE AI PACKAGE',
    spec: 'CREATE',
    unit: 'UNIFIED MEMORY · LOCAL WORKFLOW',
    note: t('모델·메모리·칩 세대별 지원 확인 후 구성'),
  },
  {
    id: 'macpro' as Family,
    label: 'Mac Pro',
    name: 'H3 Mac Pro',
    line: t('이미 갖춘 인프라에, 새로운 지능.'),
    detail: t(
      '보유한 Apple Silicon Mac Pro를 활용한 전문 작업 환경. 장비의 칩·메모리·확장 구성을 확인하고 H3 도입 범위를 설계합니다.',
    ),
    tag: 'EXISTING SYSTEM INTEGRATION',
    spec: 'INTEGRATE',
    unit: 'EXISTING MAC PRO · BESPOKE SETUP',
    note: t('보유 장비 도입 상담 · 신제품 판매 약속 아님'),
  },
]
function Fallback({ family }: { family: Family }) {
  return (
    <div className={`showroom-fallback device-${family}`}>
      <img
        src={`/brand/product-${family}.png`}
        alt={`${family} H3 gold signature package concept`}
        width={900}
        height={760}
      />
    </div>
  )
}

class Boundary extends Component<{ children: ReactNode; family: Family }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <Fallback family={this.props.family} /> : this.props.children
  }
}
export default function Showcase({
  onConsult,
  reduced,
}: {
  onConsult: (family: Family) => void
  reduced: boolean
}) {
  const [selected, setSelected] = useState<Family>('nvidia'),
    [paused, setPaused] = useState(false),
    [active, setActive] = useState(false)
  const root = useRef<HTMLElement>(null),
    data = families.find((f) => f.id === selected)!,
    staticView = new URLSearchParams(location.search).get('view') === 'static' || !canUseWebGL()
  useEffect(() => {
    let visible = false
    const sync = () => setActive(visible && !document.hidden)
    const observer = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting
        sync()
      },
      { rootMargin: '100px' },
    )
    if (root.current) observer.observe(root.current)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  return (
    <section className="showcase" id="showcase" ref={root}>
      <div className="showcase-heading">
        <p className="eyebrow">THE H3 COLLECTION / SIGNATURE EDITION</p>
        <h2>
          {t('하나의 이름.')}
          <br />
          <span>{t('서로 다른 가능성.')}</span>
        </h2>
        <p>
          {t('당신의 일에 어울리는 형태로.')}
          <br />
          {t('H3의 AI 컴퓨터 컬렉션을 만나보세요.')}
        </p>
      </div>
      <div className="family-tabs" role="group" aria-label={t('제품 쇼케이스 선택')}>
        {families.map((f, i) => (
          <button key={f.id} aria-pressed={f.id === selected} onClick={() => setSelected(f.id)}>
            <span>0{i + 1}</span>
            {f.label}
            <ArrowUpRight size={15} />
          </button>
        ))}
      </div>
      <div className="showcase-stage">
        <span className="showcase-watermark" aria-hidden="true">
          {selected === 'nvidia'
            ? 'RTX'
            : selected === 'mini'
              ? 'MINI'
              : selected === 'studio'
                ? 'STUDIO'
                : 'PRO'}
        </span>
        <div className="stage-orbit" />
        <div className="showcase-model">
          {staticView ? (
            <Fallback family={selected} />
          ) : (
            <Boundary family={selected}>
              <Suspense fallback={<Fallback family={selected} />}>
                <Scene family={selected} paused={reduced || paused} active={active} />
              </Suspense>
            </Boundary>
          )}
        </div>
        <div key={selected} className="showcase-copy">
          <p className="eyebrow">{data.tag}</p>
          <h3>{data.name}</h3>
          <h4>{data.line}</h4>
          <p>{data.detail}</p>
          <button className="button gold" onClick={() => onConsult(selected)}>
            {t('이 패키지 상담하기')}
            <ArrowUpRight size={17} />
          </button>
          <small>{data.note}</small>
        </div>
        <div className="showcase-spec">
          <strong>{data.spec}</strong>
          <span>{data.unit}</span>
        </div>
        <div className="showcase-controls">
          <span>
            <Rotate3D size={16} />{' '}
            {staticView ? t('패키지 일러스트') : t('드래그하여 다른 각도로 살펴보세요')}
          </span>
          {!staticView && !reduced && (
            <button
              aria-label={paused ? t('쇼케이스 움직임 재생') : t('쇼케이스 움직임 멈추기')}
              aria-pressed={paused}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
            </button>
          )}
        </div>
      </div>
      <div className="signature-strip">
        <span className="gold-badge">
          H3<small>AI COMPUTERS</small>
        </span>
        <div>
          <strong>{t('작은 배지에 담은, 하나의 설계 철학.')}</strong>
          <p>{t('하드웨어와 AI 환경이 당신의 일에 맞게 연결되도록.')}</p>
        </div>
        <span>SIGNATURE / H3</span>
      </div>
      <p className="showcase-disclaimer">
        {t(
          '3D와 골드 배지는 패키지 디자인 컨셉입니다. Apple 하드웨어는 Apple 제품이며 H3는 별도 AI 환경 구성 브랜드입니다. 실제 부착·외관·공급 및 지원 범위는 상담 후 확정합니다.',
        )}
      </p>
    </section>
  )
}
export function MacPackageCards({ onConsult }: { onConsult: (family: Family) => void }) {
  return (
    <div className="mac-package-grid">
      {families
        .filter((f) => f.id !== 'nvidia')
        .map((f) => (
          <article key={f.id}>
            <div className="mac-package-art">
              <Fallback family={f.id} />
            </div>
            <div className="mac-package-copy">
              <p className="eyebrow">{f.tag}</p>
              <h3>{f.name}</h3>
              <p>{f.detail}</p>
              <ul>
                <li>{t('기기·메모리 적합성 확인')}</li>
                <li>{t('H3 앱 + 로컬 모델 연결')}</li>
                <li>
                  {f.id === 'macpro'
                    ? t('보유 장비 기반 도입 설계')
                    : t('목적에 맞는 실행 환경 구성')}
                </li>
              </ul>
              <button className="button outline wide" onClick={() => onConsult(f.id)}>
                {f.label} {t('패키지 상담')}
                <ArrowUpRight size={15} />
              </button>
              <small>{f.note}</small>
            </div>
          </article>
        ))}
    </div>
  )
}
