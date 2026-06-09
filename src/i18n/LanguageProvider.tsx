'use client'

import { createContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Language } from './settings'
import { COOKIE_NAME, DEFAULT_LANG } from './settings'
import { getDictionary } from './dictionaries'
import type { Dictionary } from './types'

interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: Dictionary
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

function persistLanguage(lang: Language) {
  document.cookie = `${COOKIE_NAME}=${lang};path=/;max-age=31536000;SameSite=Lax`
  try {
    localStorage.setItem(COOKIE_NAME, lang)
  } catch {
    // localStorage unavailable
  }
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode
  initialLang: Language
}) {
  const [lang, setLangState] = useState<Language>(initialLang)
  const [t, setT] = useState<Dictionary>(() => getDictionary(initialLang))

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang)
    setT(getDictionary(newLang))
    persistLanguage(newLang)
  }, [])

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_NAME && (e.newValue === 'zh' || e.newValue === 'en')) {
        const newLang = e.newValue as Language
        setLangState(newLang)
        setT(getDictionary(newLang))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Hydrate from localStorage on mount (handles SSR/client mismatch edge case)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_NAME)
      if (stored === 'zh' || stored === 'en') {
        const storedLang = stored as Language
        if (storedLang !== lang) {
          setLangState(storedLang)
          setT(getDictionary(storedLang))
        }
      }
    } catch {
      // localStorage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}
