export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.leonwang.cc').replace(/\/$/, '')

export function absoluteUrl(path = '') {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
