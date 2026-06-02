'use client'

import { motion } from 'framer-motion'
import BlurImage from './BlurImage'
import type { PhotoType } from '@/types'

interface PhotoCardProps {
  photo: PhotoType
  index: number
  onOpen: (photo: PhotoType) => void
}

export default function PhotoCard({ photo, index, onOpen }: PhotoCardProps) {
  const w = photo.width || 800
  const h = photo.height || 600

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      layout
      className="group cursor-pointer"
      onClick={() => onOpen(photo)}
    >
      <div
        className="relative overflow-hidden rounded-lg mb-3 bg-surface"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <BlurImage
          src={photo.imageUrl}
          alt={photo.title}
          width={w}
          height={h}
          className="w-full h-full"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center">
          <span className="text-white/0 group-hover:text-white/80 text-sm tracking-wider uppercase transition-all duration-500 translate-y-2 group-hover:translate-y-0">
            查看
          </span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
        {photo.title}
      </h3>
      {photo.description && (
        <p className="text-xs text-white/30 mt-1 line-clamp-1">{photo.description}</p>
      )}
    </motion.div>
  )
}
