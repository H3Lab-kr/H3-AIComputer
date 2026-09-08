import { t, language } from './i18n'
const release = 'https://github.com/H3Lab-kr/H3-AIComputer/releases/download/v0.4.0-preview.1/'
export default function DesktopDownloads() {
  return (
    <section className="section-shell desktop-downloads" id="download">
      <div className="section-heading">
        <div>
          <p className="section-index">H3 DESKTOP / LOCAL FIRST</p>
          <h2>
            {t('내 컴퓨터에서 시작하는 AI.')}
            <br />
            <span>{t('Mac, Windows, Linux에서.')}</span>
          </h2>
        </div>
        <p>{t('설치된 모델이 기본입니다. 필요할 때 OpenRouter, Codex, Claude를 선택하세요.')}</p>
      </div>
      <div className="desktop-showcase">
        <figure className="desktop-shot">
          <img
            src={language === 'en' ? '/brand/h3-mac-041-en.png' : '/brand/h3-mac-041-ko.png'}
            alt={
              language === 'en'
                ? 'H3 native Mac app — English interface'
                : 'H3 Mac 네이티브 앱 — 한국어 화면'
            }
            loading="lazy"
            width="2440"
            height="1720"
          />
          <figcaption>H3 for Mac · {language === 'en' ? 'English' : '한국어'}</figcaption>
        </figure>
        <div>
          <p className="eyebrow">DESKTOP PREVIEW 0.4</p>
          <h3>{t('대화에서, 일을 맡기는 AI로.')}</h3>
          <p>
            {t(
              '로컬 에이전트, 모델 다운로드·업데이트, 음성·이미지·영상 도구와 선택형 API를 하나의 작업 공간으로 연결합니다.',
            )}
          </p>
          <div className="desktop-download-buttons">
            <a className="button primary" href={release + 'H3-Windows-x64.zip'}>
              Windows x64 · ZIP
            </a>
            <a className="button primary" href={release + 'H3-Linux-x64.tar.gz'}>
              Linux x64 · TAR.GZ
            </a>
            <a className="button primary" href={release + 'H3-macOS-arm64.tar.gz'}>
              macOS Apple Silicon
            </a>
            <a className="button secondary" href="/downloads/H3-Mac-0.5.0-preview.zip">
              {t('Mac 네이티브 앱 · SwiftUI')}
            </a>
          </div>
          <p className="mac-preview-note">
            {t('모델·실행 도구 별도 설치 · 공개 서명·공증 전 Preview · OS별 호환 실행 환경 필요')}
          </p>
          <a
            className="text-link"
            href="https://github.com/H3Lab-kr/H3-AIComputer/blob/main/apps/desktop/README.md"
            target="_blank"
            rel="noreferrer"
          >
            {t('설치 및 지원 범위 확인')} ↗
          </a>
        </div>
      </div>
    </section>
  )
}
