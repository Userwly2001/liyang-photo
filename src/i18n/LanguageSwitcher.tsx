'use client'

import { useLanguage } from './useLanguage'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage()

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      aria-label={t.header.langSwitchAriaLabel}
      className="text-[10px] uppercase tracking-[0.28em] text-foreground/46 transition-colors hover:text-foreground/80"
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  )
}
