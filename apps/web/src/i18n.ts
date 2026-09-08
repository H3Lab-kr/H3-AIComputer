import english from './en.json'
export type Language = 'ko' | 'en'
const requested = new URLSearchParams(location.search).get('lang')
let saved: string | null = null
try {
  saved = localStorage.getItem('h3-language')
} catch {
  /* Storage may be unavailable. */
}
export const language: Language =
  requested === 'en' || (requested !== 'ko' && saved === 'en') ? 'en' : 'ko'
export function t(text: string): string {
  return language === 'en' ? ((english as Record<string, string>)[text] ?? text) : text
}
export function setLanguage(next: Language) {
  try {
    localStorage.setItem('h3-language', next)
  } catch {
    /* URL remains the source of truth. */
  }
  const url = new URL(location.href)
  url.searchParams.set('lang', next)
  location.assign(url)
}
document.documentElement.lang = language
document.title =
  language === 'en'
    ? 'H3 AI Computers — Create ideas. Move the world. | H3Lab'
    : 'H3 AI 컴퓨터 — 생각을 만들고, 세상을 움직이다 | H3Lab'
