'use client'

import { useEffect } from 'react'

function getLocalDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
}

export default function VisitTracker() {
  useEffect(() => {
    const today = getLocalDate()
    const key = `leonphoto:visit:${today}`

    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      // If storage is unavailable, still report once for this page lifecycle.
    }

    fetch('/api/stats', {
      method: 'POST',
      keepalive: true,
    }).catch(() => {})
  }, [])

  return null
}
