import type { Language } from './settings'

const LOCALE_MAP: Record<Language, string> = {
  zh: 'zh-CN',
  en: 'en-US',
}

export function formatDate(
  date: Date | string,
  lang: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString(LOCALE_MAP[lang], options)
}

export function longDate(date: Date | string, lang: Language): string {
  return formatDate(date, lang, { year: 'numeric', month: 'long', day: 'numeric' })
}
