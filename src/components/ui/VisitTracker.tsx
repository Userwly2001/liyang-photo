'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function VisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    let referrer = document.referrer
    try {
      const storedReferrer = sessionStorage.getItem('leonphoto_entry_referrer')
      if (storedReferrer !== null) {
        referrer = storedReferrer
      } else {
        sessionStorage.setItem('leonphoto_entry_referrer', referrer)
      }
    } catch {
      // Private browsing modes can disable session storage.
    }

    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathname,
        referrer,
        search: window.location.search,
        language: navigator.language,
        screenWidth: window.screen.width,
      }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
