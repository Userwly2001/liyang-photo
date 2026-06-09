import type { Language } from '../settings'
import type { Dictionary } from '../types'
import { zh } from './zh'
import { en } from './en'

const dictionaries: Record<Language, Dictionary> = { zh, en }

export function getDictionary(lang: Language): Dictionary {
  return dictionaries[lang] || dictionaries.zh
}
