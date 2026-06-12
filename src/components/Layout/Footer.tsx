'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/i18n/useLanguage'
import PublicSecurityRecord from './PublicSecurityRecord'

function VisitCounter({ label }: { label: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => setCount(d.total ?? d.count ?? 0))
      .catch(() => {})
  }, [])

  if (count === null) return null

  return (
    <span className="inline-flex items-center gap-1 text-white/20">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      {label.replace('{count}', count.toLocaleString())}
    </span>
  )
}

export default function Footer() {
  const pathname = usePathname()
  const { t } = useLanguage()

  if (pathname === '/') return null

  const year = new Date().getFullYear()

  const footerLinks = [
    { href: '/gallery', label: t.footer.allGallery },
    { href: '/portrait', label: t.footer.portrait },
    { href: '/landscape', label: t.footer.landscape },
    { href: '/food', label: t.footer.food },
    { href: '/blog', label: t.footer.blogNotes },
  ]

  return (
    <footer className="border-t border-accent/10 mt-32">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              LEON<span className="text-accent/70">PHOTO</span>
            </h3>
            <p className="text-sm text-foreground/42 leading-relaxed max-w-xs">
              {t.footer.tagline}
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-accent/55 mb-4">
              {t.footer.navHeading}
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/48 hover:text-foreground/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest text-accent/55 mb-4">
              {t.footer.contactHeading}
            </h4>
            <ul className="space-y-2 text-sm text-foreground/48">
              <li>{t.footer.email}</li>
              <li>{t.footer.instagram}</li>
              <li>{t.footer.wechat}</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-accent/8 pt-8 text-center text-xs text-foreground/24">
          <span>{t.footer.copyright.replace('{year}', String(year))}</span>
          <PublicSecurityRecord />
          <VisitCounter label={t.footer.visits} />
        </div>
      </div>
    </footer>
  )
}
