'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import AnimatedSection from '@/components/ui/AnimatedSection'
import PhotoCard from '@/components/Gallery/PhotoCard'
import Lightbox from '@/components/Gallery/Lightbox'
import Link from 'next/link'
import type { PhotoType } from '@/types'

interface FeaturedPhotosProps {
  photos: PhotoType[]
}

export default function FeaturedPhotos({ photos }: FeaturedPhotosProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = useCallback((photo: PhotoType) => {
    const index = photos.findIndex((p) => p.id === photo.id)
    setCurrentIndex(index)
    setLightboxOpen(true)
  }, [photos])

  if (!photos.length) {
    return (
      <section className="py-32 px-6">
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4 text-center">
            精选作品集
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-20 tracking-tight">
            我的作品
          </h2>
        </AnimatedSection>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-white/20 text-sm">精选作品即将上线</p>
          <div className="flex gap-4 mt-8">
            <Link href="/portrait" className="px-5 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/60 transition-colors">浏览人像</Link>
            <Link href="/landscape" className="px-5 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/60 transition-colors">浏览风光</Link>
            <Link href="/food" className="px-5 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/60 transition-colors">浏览美食</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-32 px-6" id="work">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4 text-center">
            精选作品集
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-4 tracking-tight">
            我的作品
          </h2>
          <p className="text-sm text-white/30 text-center mb-20">
            精选 {photos.length} 张作品
          </p>
        </AnimatedSection>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 items-start"
        >
          {photos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={i}
              onOpen={openLightbox}
            />
          ))}
        </motion.div>

        <AnimatedSection delay={0.4}>
          <div className="mt-16 text-center">
            <Link
              href="/portrait"
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              浏览全部作品 →
            </Link>
          </div>
        </AnimatedSection>
      </div>

      {lightboxOpen && photos.length > 0 && (
        <Lightbox
          photos={photos}
          currentIndex={currentIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setCurrentIndex}
        />
      )}
    </section>
  )
}
