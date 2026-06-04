'use client'

import { useState, useCallback } from 'react'
import PhotoCard from './PhotoCard'
import Lightbox from './Lightbox'
import type { PhotoType } from '@/types'

interface PhotoGridProps {
  photos: PhotoType[]
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const openLightbox = useCallback((photo: PhotoType) => {
    const index = photos.findIndex((p) => p.id === photo.id)
    setCurrentIndex(index)
    setLightboxOpen(true)
  }, [photos])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const navigate = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  if (!photos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-6 opacity-20">◻</div>
        <p className="text-white/30 text-sm">暂无照片</p>
        <p className="text-white/10 text-xs mt-2">照片上传后将在此展示</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={i}
            onOpen={openLightbox}
          />
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          photos={photos}
          currentIndex={currentIndex}
          onClose={closeLightbox}
          onNavigate={navigate}
        />
      )}
    </>
  )
}
