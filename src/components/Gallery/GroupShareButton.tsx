'use client'

import { useState } from 'react'
import { useLanguage } from '@/i18n/useLanguage'

export default function GroupShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      // Cancelling the native share sheet needs no error state.
    }
  }

  return (
    <button onClick={share} className="border-b border-accent/35 pb-1 text-xs text-accent/75 transition-colors hover:border-accent hover:text-accent">
      {copied ? t.gallery.groupLinkCopied : t.gallery.shareGroup}
    </button>
  )
}
