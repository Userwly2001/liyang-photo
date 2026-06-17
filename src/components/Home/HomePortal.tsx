'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLanguage } from '@/i18n/useLanguage'
import { LanguageSwitcher } from '@/i18n/LanguageSwitcher'
import PublicSecurityRecord from '@/components/Layout/PublicSecurityRecord'

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
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const intro = introRef.current
    if (!intro) return

    const onPointerMove = (event: PointerEvent) => {
      intro.style.setProperty('--pointer-x', `${event.clientX}px`)
      intro.style.setProperty('--pointer-y', `${event.clientY}px`)
    }

    const onScroll = () => {
      const heroHeight = window.innerHeight
      const scrolled = window.scrollY
      const progress = Math.min(scrolled / (heroHeight * 0.8), 1)
      setScrollProgress(progress)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
    }
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
            className="flex items-start justify-between gap-5"
          >
            <span className="flex flex-col">
              <span
                className="text-xl font-semibold uppercase text-foreground sm:text-2xl"
                style={{ textShadow: '0 2px 16px rgba(0,0,0,0.75)' }}
              >
                {t.home.hero.topLeft}
              </span>
              <span
                className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-accent/85 sm:text-[10px]"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}
              >
                {t.home.hero.identity}
              </span>
            </span>
            <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-foreground/72 sm:gap-5 sm:text-xs">
              <span className="hidden sm:inline">{displayLocation}</span>
              <a href="/ielts-vocab/index.html" className="border-b border-accent/45 pb-1 transition-colors hover:border-accent hover:text-accent">
                雅思刷词
              </a>
              <Link href="/about" className="border-b border-accent/45 pb-1 transition-colors hover:border-accent hover:text-accent">
                {t.home.hero.about}
              </Link>
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
              className="mt-7 max-w-[20rem] text-base leading-8 text-foreground/88 sm:max-w-xl sm:text-lg sm:leading-9"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
            >
              {t.home.hero.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={enter}
            aria-label={t.home.hero.enterAriaLabel}
            className="home-scroll-cue absolute bottom-7 right-5 flex items-end gap-4 sm:bottom-10 sm:right-8 sm:gap-5 lg:right-12"
          >
            <span className="flex flex-col items-end gap-1.5 pb-1 text-right">
              <span className="text-[10px] uppercase tracking-[0.36em] text-accent">
                Scroll
              </span>
              <span className="text-[10px] tracking-[0.18em] text-foreground/72 sm:text-xs">
                {t.home.hero.enter}
              </span>
            </span>

            <span className="home-scroll-orbit relative flex h-16 w-16 items-center justify-center rounded-full border border-accent/60 bg-background/42 backdrop-blur-md sm:h-[4.5rem] sm:w-[4.5rem]">
              <span className="home-scroll-orbit-inner absolute inset-[7px] rounded-full border border-accent/20" />
              <span className="home-scroll-arrow text-lg text-accent">↓</span>
            </span>

            <span className="relative hidden h-28 w-px overflow-visible bg-accent/18 sm:flex">
              <span
                className="absolute left-0 top-0 w-full bg-accent transition-[height] duration-75 ease-linear"
                style={{
                  height: `${Math.max(scrollProgress * 100, 18)}%`,
                  boxShadow: '0 0 10px rgba(212,168,75,0.65)',
                }}
              />
              <span
                className="home-scroll-dot absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent transition-[top] duration-75 ease-linear"
                style={{
                  top: `${Math.max(scrollProgress * 100, 18)}%`,
                }}
              />
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

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-accent/15 pt-5 text-[10px] tracking-[0.12em] text-foreground/32">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="uppercase tracking-[0.24em]">© {year} Leon Wang</span>
              <PublicSecurityRecord className="tracking-normal" />
            </div>
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
