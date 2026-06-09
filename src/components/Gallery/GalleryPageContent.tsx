'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import PhotoGrid from './PhotoGrid'
import AnimatedSection from '@/components/ui/AnimatedSection'
import type { PhotoType } from '@/types'

interface GalleryPageContentProps {
  title: string
  subtitle: string
  photos: PhotoType[]
  emptyMessage?: string
}

export default function GalleryPageContent({
  title,
  subtitle,
  photos,
  emptyMessage = '暂无作品',
}: GalleryPageContentProps) {
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
              作品集
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
              aria-label="相册分类"
            >
              {[
                { href: '/gallery', label: '全部' },
                { href: '/portrait', label: '人像' },
                { href: '/landscape', label: '风景' },
                { href: '/food', label: '美食' },
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
          </div>
        </AnimatedSection>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6 text-accent/20">◻</div>
            <p className="text-foreground/32 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </div>
  )
}
