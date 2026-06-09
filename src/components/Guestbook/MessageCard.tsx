'use client'

import { useRef, useState, type MouseEvent } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/i18n/useLanguage'
import type { MessageType } from '@/types'

interface MessageCardProps {
  message: MessageType
  index: number
}

export default function MessageCard({ message, index }: MessageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const { lang } = useLanguage()

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: x * 8, y: y * -8 })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setIsHovered(false)
  }

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: 'preserve-3d',
          transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        }}
        className="relative group"
      >
        <div
          className={`relative p-5 rounded-xl border transition-all duration-300 ${
            isHovered
              ? 'border-white/20 bg-surface-elevated shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]'
              : 'border-white/5 bg-surface'
          }`}
        >
          {/* Glow border on hover */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-xl opacity-50 transition-opacity duration-500 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
              }}
            />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
                {message.nickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{message.nickname}</span>
            </div>
            <span className="text-[10px] text-white/20">
              {new Date(message.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Content */}
          <p className="text-sm text-white/60 leading-relaxed relative z-10">
            {message.content}
          </p>

          {/* Images */}
          {message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 relative z-10">
              {message.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedImage(img)}
                  className="w-20 h-20 rounded-lg overflow-hidden bg-surface-hover group/img cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Shared photo ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Type badge */}
          {message.type === 'photo_share' && (
            <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider text-white/10">
              📷
            </div>
          )}
        </div>
      </motion.div>

      {/* Image preview modal */}
      {expandedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setExpandedImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage}
            alt="Shared photo"
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      )}
    </>
  )
}
