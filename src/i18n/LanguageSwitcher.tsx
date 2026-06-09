'use client'

import { useLanguage } from './useLanguage'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage()

  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      aria-label={t.header.langSwitchAriaLabel}
      className="rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-foreground/72 transition-all hover:border-accent/70 hover:bg-accent/15 hover:text-foreground"
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  )
}
