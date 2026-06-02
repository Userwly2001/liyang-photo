'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function HeroSection() {
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
      className="relative h-[120vh] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-white/[0.02] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-white/[0.015] blur-[100px]" />
      </div>

      {/* Hero text */}
      <div className="relative z-10 text-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs uppercase tracking-[0.3em] text-white/30 mb-8"
        >
          摄影作品集
        </motion.p>

        <h1
          ref={textRef}
          className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold tracking-tight leading-none will-change-transform"
        >
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            镜头之下
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="block text-white/20"
          >
            光影之间
          </motion.span>
        </h1>

        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-12 text-sm text-white/40 tracking-wide max-w-md mx-auto leading-relaxed"
        >
          捕捉光与影的交汇 ——
          Leon Wang 的人像与风光摄影作品
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/20">
          向下滚动
        </span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
      </motion.div>
    </section>
  )
}
