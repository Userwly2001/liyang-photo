'use client'

import { useRouter } from 'next/navigation'
import { useLanguage } from './useLanguage'

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage()
  const router = useRouter()

  const switchLanguage = () => {
    setLang(lang === 'zh' ? 'en' : 'zh')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      aria-label={t.header.langSwitchAriaLabel}
      className="rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-xs uppercase tracking-[0.15em] text-foreground/72 transition-all hover:border-accent/70 hover:bg-accent/15 hover:text-foreground"
    >
      {lang === 'zh' ? 'EN' : '中'}
    </button>
  )
}
