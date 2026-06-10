'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PhotoGrid from './PhotoGrid'
import GroupGrid from './GroupGrid'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { useLanguage } from '@/i18n/useLanguage'
import type { PhotoGroupType, PhotoType } from '@/types'

interface GalleryPageContentProps {
  title: string
  subtitle: string
  photos: PhotoType[]
  groups?: PhotoGroupType[]
  emptyMessage?: string
}

export default function GalleryPageContent({
  title,
  subtitle,
  photos,
  groups = [],
  emptyMessage,
}: GalleryPageContentProps) {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [view, setView] = useState<'groups' | 'photos'>(searchParams.get('photo') || groups.length === 0 ? 'photos' : 'groups')
  const defaultEmpty = emptyMessage || t.gallery.emptyDefault

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs uppercase tracking-[0.3em] text-accent/55 mb-4"
            >
              {t.gallery.collectionLabel}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4 text-4xl font-semibold sm:text-6xl md:text-7xl"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm text-foreground/45 max-w-md leading-relaxed"
            >
              {subtitle}
            </motion.p>
            <motion.nav
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-foreground/38"
              aria-label={t.gallery.navAriaLabel}
            >
              {[
                { href: '/gallery', label: t.gallery.navAll },
                { href: '/portrait', label: t.gallery.navPortrait },
                { href: '/landscape', label: t.gallery.navLandscape },
                { href: '/food', label: t.gallery.navFood },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-accent/15 pb-1 transition-colors hover:border-accent/65 hover:text-foreground/78"
                >
                  {link.label}
                </Link>
              ))}
            </motion.nav>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.48 }}
              className="mt-8 flex items-center gap-1 border-b border-white/10"
            >
              <button
                onClick={() => setView('groups')}
                disabled={!groups.length}
                className={`relative px-4 py-3 text-xs transition-colors disabled:opacity-25 ${view === 'groups' ? 'text-accent' : 'text-foreground/38 hover:text-foreground/70'}`}
              >
                {t.gallery.viewGroups}
                {view === 'groups' && <span className="absolute inset-x-0 bottom-[-1px] h-px bg-accent" />}
              </button>
              <button
                onClick={() => setView('photos')}
                className={`relative px-4 py-3 text-xs transition-colors ${view === 'photos' ? 'text-accent' : 'text-foreground/38 hover:text-foreground/70'}`}
              >
                {t.gallery.viewPhotos}
                {view === 'photos' && <span className="absolute inset-x-0 bottom-[-1px] h-px bg-accent" />}
              </button>
              <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-foreground/20">
                {view === 'groups' ? `${groups.length} ${t.gallery.groups}` : `${photos.length} ${t.gallery.frames}`}
              </span>
            </motion.div>
          </div>
        </AnimatedSection>

        {view === 'groups' ? (
          <GroupGrid groups={groups} />
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6 text-accent/20">◻</div>
            <p className="text-foreground/32 text-sm">{defaultEmpty}</p>
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </div>
  )
}
