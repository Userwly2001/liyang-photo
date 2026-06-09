'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLanguage } from '@/i18n/useLanguage'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'

interface PortalPhoto {
  imageUrl: string
  title: string
}

interface HomePortalProps {
  name: string
  title: string
  bio: string
  location?: string
  heroPhoto?: PortalPhoto
  galleryPhoto?: PortalPhoto
  journalPhoto?: PortalPhoto
  photoCount: number
  postCount: number
}

export default function HomePortal({
  name,
  title,
  bio,
  location,
  heroPhoto,
  galleryPhoto,
  journalPhoto,
  photoCount,
  postCount,
}: HomePortalProps) {
  const introRef = useRef<HTMLElement>(null)
  const portalRef = useRef<HTMLElement>(null)
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  useEffect(() => {
    const intro = introRef.current
    if (!intro) return

    const onPointerMove = (event: PointerEvent) => {
      intro.style.setProperty('--pointer-x', `${event.clientX}px`)
      intro.style.setProperty('--pointer-y', `${event.clientY}px`)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  const enter = () => {
    portalRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const heroTitle = heroPhoto?.title || t.home.portal.coverTitle
  const displayName = name || t.about.nameFallback
  const displayTitle = title || t.home.portal.titleFallback
  const displayBio = bio || t.home.portal.bioFallback
  const displayLocation = location || t.home.hero.topRight

  return (
    <div className="home-portal bg-background">
      <section
        ref={introRef}
        className="home-portal-intro relative flex h-[100svh] overflow-hidden"
      >
        <div className="absolute inset-0 bg-black">
          {heroPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroPhoto.imageUrl}
              alt={heroTitle}
              className="h-full w-full object-cover"
            />
          )}
          <div className="home-portal-light absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1480px] flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-foreground/72"
          >
            <span>{t.home.hero.topLeft}</span>
            <span className="flex items-center gap-4">
              <span>{displayLocation}</span>
              <LanguageSwitcher />
            </span>
          </motion.div>

          <div className="pb-[2svh] pt-12 sm:pt-16">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mb-6 text-[10px] uppercase tracking-[0.38em] text-accent/78 sm:text-xs"
            >
              {t.home.hero.archiveLabel.replace('{year}', String(year))}
            </motion.p>
            <h1
              className="max-w-5xl text-5xl font-semibold leading-[0.92] sm:text-7xl md:text-8xl lg:text-[7.8rem]"
              style={{ textShadow: '0 2px 40px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)' }}
            >
              <motion.span
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="block text-foreground"
              >
                {t.home.hero.line1}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 34 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
                className="block text-accent"
              >
                {t.home.hero.line2}
              </motion.span>
            </h1>
            <p
              className="mt-6 max-w-[17rem] text-sm leading-7 text-foreground/78 sm:max-w-md"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
            >
              {t.home.hero.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={enter}
            aria-label={t.home.hero.enterAriaLabel}
            className="absolute right-0 bottom-0 flex items-end gap-5 pr-6 pb-10 sm:pr-10 sm:pb-12 lg:pr-14 group"
          >
            {/* Vertical metallic line with pulsing dot */}
            <span className="relative flex w-px items-start h-28 sm:h-32" style={{ background: 'linear-gradient(to bottom, #d4a84b 0%, transparent 100%)' }}>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: '0 0 16px rgba(212,168,75,0.7)' }} />
            </span>
            {/* Rotated scroll text */}
            <span className="text-[11px] uppercase tracking-[0.4em] text-accent/45 group-hover:text-accent/75 transition-colors [writing-mode:vertical-rl] pb-0.5">
              Scroll
            </span>
          </button>
        </div>
      </section>

      <section
        id="portal"
        ref={portalRef}
        className="relative min-h-[100svh] px-5 pb-8 pt-8 sm:px-8 lg:px-12"
      >
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1480px] flex-col">
          <div className="flex items-start justify-between gap-8 border-b border-accent/15 pb-7">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.32em] text-accent/62">
                {t.home.portal.brandLabel}
              </p>
              <h2 className="text-3xl font-semibold sm:text-5xl">{displayName}</h2>
            </div>
            <div className="max-w-sm text-right">
              <p className="text-sm text-foreground/52">{displayTitle}</p>
              <p className="mt-2 hidden text-xs leading-6 text-foreground/32 sm:block">
                {displayBio}
              </p>
            </div>
          </div>

          <div className="grid flex-1 gap-3 py-5 md:grid-cols-[1.35fr_1fr]">
            <PortalLink
              href="/gallery"
              label={t.home.portal.galleryLabel}
              english={t.home.portal.galleryEnglish}
              detail={`${photoCount} 张影像 · 人像 / 风景 / 美食`}
              photo={galleryPhoto || heroPhoto}
              index="01"
            />
            <PortalLink
              href="/blog"
              label={t.home.portal.blogLabel}
              english={t.home.portal.blogEnglish}
              detail={`${postCount} 篇随笔 · 生活 / 成长 / 摄影`}
              photo={journalPhoto || heroPhoto}
              index="02"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-accent/15 pt-5 text-[10px] uppercase tracking-[0.24em] text-foreground/32">
            <span>© {year} Leon Wang</span>
            <nav className="flex gap-5 sm:gap-7">
              <Link href="/about" className="transition-colors hover:text-foreground/75">
                {t.home.portal.aboutNav}
              </Link>
              <Link href="/guestbook" className="transition-colors hover:text-foreground/75">
                {t.home.portal.guestbookNav}
              </Link>
              <Link href="/admin" className="transition-colors hover:text-foreground/75">
                {t.home.portal.adminNav}
              </Link>
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </section>
    </div>
  )
}

function PortalLink({
  href,
  label,
  english,
  detail,
  photo,
  index,
}: {
  href: string
  label: string
  english: string
  detail: string
  photo?: PortalPhoto
  index: string
}) {
  return (
    <Link
      href={href}
      className="group relative min-h-[34svh] overflow-hidden rounded-sm border border-accent/20 bg-black md:min-h-0"
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.imageUrl}
          alt={photo.title}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 group-hover:scale-[1.025]"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.5),transparent_50%)]" />
      <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7">
        <div
          className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-foreground/60"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          <span>{index}</span>
          <span>{english}</span>
        </div>
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h3
              className="text-4xl font-semibold sm:text-6xl lg:text-7xl"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.5)' }}
            >
              {label}
            </h3>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/5 backdrop-blur-md text-lg transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-black">
              ↗
            </span>
          </div>
          <p className="border-t border-accent/30 pt-4 text-xs text-foreground/62">{detail}</p>
        </div>
      </div>
    </Link>
  )
}
