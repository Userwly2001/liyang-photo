'use client'

import { motion } from 'framer-motion'
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
    <div className="pt-28 pb-24 px-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4"
            >
              作品集
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm text-white/40 max-w-md leading-relaxed"
            >
              {subtitle}
            </motion.p>
          </div>
        </AnimatedSection>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6 opacity-20">◻</div>
            <p className="text-white/30 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </div>
  )
}
