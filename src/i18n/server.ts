import 'server-only'

import { cookies, headers } from 'next/headers'
import { COOKIE_NAME, detectLanguage, isLanguage, type Language } from './settings'

export async function getRequestLanguage(): Promise<Language> {
  const cookieLanguage = (await cookies()).get(COOKIE_NAME)?.value
  if (isLanguage(cookieLanguage)) return cookieLanguage

  return detectLanguage((await headers()).get('accept-language'))
}
