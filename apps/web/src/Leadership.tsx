import { useEffect } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { language, setLanguage } from './i18n'
import './leadership.css'

const members = [
  {
    name: '정락현',
    image: 'jung',
    role: ['대표', 'Chief Executive Officer'],
    bio: [
      ['세종대학교 산업대학원 교수', 'Professor, Graduate School of Industry, Sejong University'],
      [
        '서울주택도시공사(SH공사) 30년 명예퇴직',
        'Retired after 30 years at Seoul Housing & Communities Corporation (SH)',
      ],
      [
        '강서구·구로구·송파구·광명시·평택시 도시계획위원회 위원',
        'Urban Planning Committee Member: Gangseo-gu, Guro-gu, Songpa-gu, Gwangmyeong and Pyeongtaek',
      ],
      [
        '한국도시설계학회 이사 및 AI도시설계연구위원회 위원장',
        'Board Member, Urban Design Institute of Korea; Chair, AI Urban Design Research Committee',
      ],
      ['KBS비즈니스영상원 원장', 'Head, KBS Business Video Institute'],
      [
        '(사)한국인공지능협회 부회장 및 인공지능정책원 원장',
        'Vice President, Korea Artificial Intelligence Association; Head, AI Policy Institute',
      ],
      ['(사)한국인공지능연구소 고문', 'Advisor, Korea Artificial Intelligence Research Institute'],
    ],
  },
  {
    name: '이강훈',
    image: 'lee',
    role: ['기술총괄', 'Head of Technology'],
    bio: [
      ['(사)한국인공지능연구소 소장', 'Director, Korea Artificial Intelligence Research Institute'],
      ['(주)퀀텀아이 대표', 'CEO, 퀀텀아이'],
    ],
  },
  {
    name: '문아라',
    image: 'moon',
    role: ['운영총괄', 'Head of Operations'],
    bio: [
      ['(주)한국인공지능아카데미 공동대표', 'Co-CEO, Korea Artificial Intelligence Academy'],
      [
        '(사)한국인공지능연구소 사무국장',
        'Secretary General, Korea Artificial Intelligence Research Institute',
      ],
    ],
  },
]

export default function Leadership() {
  const en = language === 'en'
  const home = `/?lang=${language}`
  useEffect(() => {
    document.title = en ? 'Leadership | H3 AI Computers' : '임원 소개 | H3 AI 컴퓨터'
  }, [en])
  return (
    <div className="leadership-page">
      <a className="skip-link" href="#main">
        {en ? 'Skip to content' : '본문으로 건너뛰기'}
      </a>
      <header className="site-header leadership-header">
        <a className="brand" href={home} aria-label={en ? 'H3 home' : 'H3 홈'}>
          <span className="wordmark">
            <span>H3</span>
            <i />
          </span>
          <span>{en ? 'AI Computers' : 'AI 컴퓨터'}</span>
        </a>
        <a className="leadership-home" href={home}>
          <ArrowLeft size={16} />
          {en ? 'Explore H3' : 'H3 둘러보기'}
        </a>
        <div className="language-switch" role="group" aria-label="Language / 언어">
          <button lang="ko" aria-pressed={!en} onClick={() => setLanguage('ko')}>
            KO
          </button>
          <span>/</span>
          <button lang="en" aria-pressed={en} onClick={() => setLanguage('en')}>
            EN
          </button>
        </div>
      </header>
      <main id="main">
        <section className="leadership-intro" aria-labelledby="leadership-title">
          <div className="leadership-intro-inner">
            <p className="leadership-eyebrow">H3LAB / LEADERSHIP</p>
            <h1 id="leadership-title">
              {en ? (
                <>
                  The people
                  <br />
                  behind H3.
                </>
              ) : (
                <>
                  AI 컴퓨터의 미래,
                  <br />
                  사람에서 시작합니다.
                </>
              )}
            </h1>
            <div className="leadership-intro-bottom">
              <p>
                {en
                  ? 'Meet the founders building H3 — bringing leadership, technology and operations together around AI computers.'
                  : '경영, 기술, 운영의 경험을 하나로.\nAI 컴퓨터 브랜드 H3를 함께 시작한 세 사람을 소개합니다.'}
              </p>
              <span>
                H3 <span>FOUNDING TEAM</span>
              </span>
            </div>
          </div>
        </section>
        <section className="leadership-team" aria-labelledby="team-title">
          <div className="leadership-section-heading">
            <h2 id="team-title">{en ? 'Our leadership' : '임원 소개'}</h2>
            <span>01 — 03</span>
          </div>
          <div className="leadership-grid">
            {members.map((member, index) => (
              <article
                className="leader-card"
                key={member.name}
                aria-labelledby={`leader-${member.image}`}
              >
                <div className="leader-portrait">
                  <img
                    src={`/members/${member.image}.jpg`}
                    alt={`${member.name} ${member.role[en ? 1 : 0]}`}
                    width={900}
                    height={900}
                  />
                  <span aria-hidden="true">0{index + 1}</span>
                </div>
                <div className="leader-identity">
                  <p>{member.role[en ? 1 : 0]}</p>
                  <h3 id={`leader-${member.image}`} lang="ko">
                    {member.name}
                  </h3>
                  <span>{en ? 'Co-founder · H3' : 'H3 공동 창립'}</span>
                </div>
                <h4>{en ? 'Professional background' : '주요 약력'}</h4>
                <ul>
                  {member.bio.map(([ko, english]) => (
                    <li key={ko}>{en ? english : ko}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section className="leadership-contact">
          <p>YOUR AI. YOUR COMPUTER.</p>
          <h2>{en ? 'Build what comes next, with H3.' : 'H3와 함께, 다음 가능성을 만드세요.'}</h2>
          <a href="mailto:hi@h3lab.kr">
            {en ? 'Contact H3Lab' : 'H3Lab에 문의하기'}
            <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <footer className="leadership-footer">
        <span>© 2026 H3Lab.</span>
        <a href={home}>
          {en ? 'H3 AI Computers' : 'H3 AI 컴퓨터'} <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  )
}
