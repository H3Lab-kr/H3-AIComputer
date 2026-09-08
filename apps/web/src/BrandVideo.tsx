import { t, language } from './i18n'
import { useRef, useState } from 'react'
import { ArrowDownToLine, Play } from 'lucide-react'
export default function BrandVideo() {
  const ref = useRef<HTMLVideoElement>(null),
    [started, setStarted] = useState(false),
    [error, setError] = useState(false)
  return (
    <section className="brand-film section-shell" id="brand-film">
      <div className="section-heading">
        <div>
          <p className="section-index">THE BRAND FILM / 00:30</p>
          <h2>
            {t('당신의 상상에,')}
            <br />
            <span className="muted-word">{t('컴퓨터라는 형태를.')}</span>
          </h2>
        </div>
        <p>
          {t('생각이 장면이 되고, 아이디어가 일이 되는 곳.')}
          <br />
          {t('H3Lab이 만드는 AI 컴퓨터의 새로운 시작.')}
        </p>
      </div>
      <p className="film-language-note">
        {language === 'ko'
          ? '한국어 나레이션 · AI 합성 음성'
          : 'English narration · AI-generated voice'}
      </p>
      <div className="film-player">
        <video
          ref={ref}
          controls={started}
          playsInline
          preload="none"
          poster={`/media/h3-brand-poster-${language}.jpg`}
          onPlay={() => setStarted(true)}
          onError={() => setError(true)}
          aria-label={t('H3 AI 컴퓨터 브랜드 필름 30초')}
        >
          <source src={`/media/h3-brand-film-${language}.mp4`} type="video/mp4" />
          <track
            kind="captions"
            src={`/media/h3-brand-film.${language}.vtt`}
            srcLang={language}
            label={language === 'ko' ? '한국어' : 'English'}
          />
          {t('브라우저가 영상을 지원하지 않습니다.')}
        </video>
        {!started && (
          <button
            className="film-play"
            onClick={async () => {
              try {
                await ref.current?.play()
                setStarted(true)
              } catch {
                setError(true)
              }
            }}
          >
            <span>
              <Play fill="currentColor" size={27} />
            </span>
            <strong>{t('브랜드 필름 보기')}</strong>
            <small>H3 / YOUR AI. YOUR COMPUTER.</small>
          </button>
        )}
      </div>
      <div className="film-caption">
        <p role="status">
          {error
            ? t('재생이 어려우면 원본 영상을 다운로드해 확인해주세요.')
            : t('3D 브랜드 컨셉 필름 · 오리지널 모션 그래픽과 음악 · 제품 구성은 제안 단계입니다.')}
        </p>
        <a href={`/media/h3-brand-film-${language}.mp4`} download>
          {t('영상 다운로드')}
          <ArrowDownToLine size={14} />
        </a>
      </div>
    </section>
  )
}
