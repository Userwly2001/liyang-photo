'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import AnimatedSection from '@/components/ui/AnimatedSection'

const featured = [
  {
    category: '人像',
    description: '用光影讲述每一个人物的故事',
    href: '/portrait',
    gradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    category: '风光',
    description: '在静谧中感受大自然的壮丽',
    href: '/landscape',
    gradient: 'from-blue-500/10 to-teal-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    category: '美食',
    description: '用镜头品味生活中的美好滋味',
    href: '/food',
    gradient: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20',
  },
]

export default function FeaturedWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} className="relative py-32 px-6" id="work">
      <motion.div style={{ opacity }} className="max-w-7xl mx-auto">
        <AnimatedSection>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4 text-center">
            精选作品集
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center mb-20 tracking-tight">
            我的作品
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featured.map((item, i) => (
            <AnimatedSection key={item.category} delay={i * 0.2}>
              <Link href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative h-[400px] sm:h-[500px] rounded-xl overflow-hidden border ${item.borderColor} bg-gradient-to-br ${item.gradient} p-8 sm:p-12 flex flex-col justify-end cursor-pointer`}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Category number */}
                  <span className="absolute top-8 right-8 text-8xl font-bold text-white/[0.03] select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="relative z-10">
                    <h3 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
                      {item.category}
                    </h3>
                    <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors duration-300">
                      <span>浏览作品</span>
                      <span className="text-lg leading-none group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
