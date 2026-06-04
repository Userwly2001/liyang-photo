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
      <section className="px-6 py-32">
        <AnimatedSection>
          <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-accent/55">
            Featured Works
          </p>
          <h2 className="mb-20 text-center text-4xl font-semibold sm:text-5xl md:text-6xl">
            等待第一面展墙
          </h2>
        </AnimatedSection>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-foreground/28">上传并设为精选后，首页会自动形成第一屏视觉。</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/portrait" className="rounded-sm border border-accent/20 px-5 py-2.5 text-sm text-foreground/55 transition-colors hover:border-accent/45 hover:text-foreground">浏览人像</Link>
            <Link href="/landscape" className="rounded-sm border border-accent/20 px-5 py-2.5 text-sm text-foreground/55 transition-colors hover:border-accent/45 hover:text-foreground">浏览风光</Link>
            <Link href="/food" className="rounded-sm border border-accent/20 px-5 py-2.5 text-sm text-foreground/55 transition-colors hover:border-accent/45 hover:text-foreground">浏览美食</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="px-6 py-32" id="work">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-accent/55">
            Featured Works
          </p>
          <h2 className="mb-4 text-center text-4xl font-semibold sm:text-5xl md:text-6xl">
            近期展墙
          </h2>
          <p className="mb-20 text-center text-sm text-foreground/34">
            {photos.length} 张被挑出来的照片，先让它们安静地站在这里。
          </p>
        </AnimatedSection>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3"
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
              className="inline-flex items-center gap-2 border-b border-accent/25 pb-2 text-sm text-foreground/45 transition-colors hover:border-accent/70 hover:text-foreground/80"
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
