'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import AnimatedSection from '@/components/ui/AnimatedSection'

const stats = [
  { label: '拍摄年限', value: '10+' },
  { label: '人像作品', value: '5000+' },
  { label: '到访城市', value: '30+' },
  { label: '摄影展览', value: '12' },
]

export default function ParallaxSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} className="relative h-[80vh] overflow-hidden">
      {/* Parallax background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 bg-gradient-to-b from-surface to-background"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center px-6"
      >
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4 text-center">
            摄影之路
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 tracking-tight max-w-2xl">
            每一帧都是
            <span className="text-white/40"> 光与时间 </span>
            的对话
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.1}>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                  {stat.label}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
