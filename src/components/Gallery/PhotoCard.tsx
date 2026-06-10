'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import BlurImage from './BlurImage'
import { useLanguage } from '@/i18n/useLanguage'
import type { PhotoType } from '@/types'

interface PhotoCardProps {
  photo: PhotoType
  index: number
  onOpen: (photo: PhotoType) => void
}

export default function PhotoCard({ photo, index, onOpen }: PhotoCardProps) {
  const w = photo.width || 800
  const h = photo.height || 600
  const { t } = useLanguage()

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
        className="relative mb-4 overflow-hidden rounded-sm bg-surface ring-1 ring-accent/10 transition-all duration-500 group-hover:ring-accent/35"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <BlurImage
          src={photo.thumbnailUrl || photo.imageUrl}
          alt={photo.description ? `${photo.title} - ${photo.description}` : `${photo.title} - Leon Wang 摄影作品`}
          width={w}
          height={h}
          className="w-full h-full transition-transform duration-700 group-hover:scale-[1.025]"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/22" />
        <div className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-between opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-[10px] uppercase tracking-[0.24em] text-foreground/82">
            {t.common.view}
          </span>
          <span className="h-px flex-1 mx-3 bg-accent/45" />
          <span className="text-[10px] text-foreground/64">{photo.category}</span>
        </div>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-foreground/78 transition-colors group-hover:text-foreground">
            <Link href={`/gallery/photo/${photo.id}`} onClick={(event) => event.stopPropagation()} className="hover:text-accent">
              {photo.title}
            </Link>
          </h3>
          {photo.description && (
            <p className="mt-1 line-clamp-1 text-xs text-foreground/32">{photo.description}</p>
          )}
        </div>
        <span className="mt-1 text-[10px] text-accent/55">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </motion.div>
  )
}
