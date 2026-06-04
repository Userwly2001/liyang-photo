'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
interface HeroSectionProps {
  photo?: {
    imageUrl: string
    title: string
    description?: string
    showCaption?: boolean
  }
}

export default function HeroSection({ photo }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = window.innerHeight

      if (textRef.current) {
        const scale = 1 - (scrollY / maxScroll) * 0.3
        const opacity = 1 - (scrollY / maxScroll) * 1.2
        textRef.current.style.transform = `scale(${Math.max(scale, 0.7)})`
        textRef.current.style.opacity = `${Math.max(opacity, 0)}`
      }

      if (subtitleRef.current) {
        const opacity = 1 - (scrollY / maxScroll) * 1.5
        subtitleRef.current.style.opacity = `${Math.max(opacity, 0)}`
        subtitleRef.current.style.transform = `translateY(${scrollY * 0.3}px)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden border-b border-accent/10"
    >
      <div className="absolute inset-0 bg-[#080706]">
        {photo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="h-full w-full object-cover opacity-70 saturate-[0.88] contrast-[1.04]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,7,6,0.92),rgba(8,7,6,0.45)_42%,rgba(8,7,6,0.78))]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,7,6,0.92),transparent_36%,rgba(8,7,6,0.72))]" />
          </>
        ) : (
          <div className="absolute inset-8 border border-accent/10 bg-[linear-gradient(135deg,rgba(198,161,91,0.10),transparent_38%,rgba(244,239,230,0.04))]" />
        )}
      </div>

      <div className="relative z-10 w-full max-w-7xl px-5 pt-20 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-xs uppercase tracking-[0.34em] text-accent/70"
        >
          Leon Wang Photography
        </motion.p>

        <h1
          ref={textRef}
          className="max-w-4xl text-5xl font-semibold leading-[0.92] text-foreground will-change-transform min-[390px]:text-6xl sm:text-7xl md:text-8xl lg:text-[8.8rem]"
        >
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            影像
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="block text-foreground/28"
          >
            与生活札记
          </motion.span>
        </h1>

        <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,32rem)_auto] md:items-end">
          <motion.p
            ref={subtitleRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="max-w-[34rem] text-sm leading-7 text-foreground/58"
          >
            人像、风景、美食和城市片段。这里不只陈列照片，也保存拍摄前后的感受、生活里的低声部，以及还没有完全想明白的事。
          </motion.p>
          {photo && photo.showCaption !== false && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="hidden min-w-56 border-l border-accent/25 pl-5 text-xs text-foreground/42 md:block"
            >
              <p className="mb-2 text-accent/70">Featured Frame</p>
              <p className="text-foreground/65">{photo.title}</p>
              {photo.description && (
                <p className="mt-2 leading-5 text-foreground/38">{photo.description}</p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-5 right-5 z-10 mx-auto flex max-w-7xl items-center justify-between text-[10px] uppercase tracking-[0.22em] text-foreground/28 sm:bottom-10 sm:left-6 sm:right-6 sm:tracking-[0.3em]"
      >
        <span>Scroll</span>
        <span className="h-px flex-1 mx-5 bg-accent/18" />
        <span>Portfolio / Journal</span>
      </motion.div>
    </section>
  )
}
