export const COOKIE_NAME = 'lang'
export const DEFAULT_LANG = 'zh' as const

export type Language = 'zh' | 'en'

export function isLanguage(value: string | undefined): value is Language {
  return value === 'zh' || value === 'en'
}

export function detectLanguage(acceptLanguage: string | null): Language {
  if (!acceptLanguage) return DEFAULT_LANG

  const preferences = acceptLanguage
    .split(',')
    .map((item, index) => {
      const [locale, ...parameters] = item.trim().toLowerCase().split(';')
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='))
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.split('=')[1]) : 1
      return { locale, quality: Number.isFinite(quality) ? quality : 0, index }
    })
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  for (const preference of preferences) {
    if (preference.quality <= 0) continue
    const baseLanguage = preference.locale.split('-')[0]
    if (isLanguage(baseLanguage)) return baseLanguage
  }

  return 'en'
}
