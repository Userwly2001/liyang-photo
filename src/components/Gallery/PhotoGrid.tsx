'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import PhotoCard from './PhotoCard'
import Lightbox from './Lightbox'
import { useLanguage } from '@/i18n/useLanguage'
import type { PhotoType } from '@/types'

interface PhotoGridProps {
  photos: PhotoType[]
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { t } = useLanguage()
  const searchParams = useSearchParams()

  const updatePhotoParam = useCallback((photoId?: string) => {
    const url = new URL(window.location.href)
    if (photoId) url.searchParams.set('photo', photoId)
    else url.searchParams.delete('photo')
    window.history.replaceState({}, '', url)
  }, [])

  useEffect(() => {
    const photoId = searchParams.get('photo')
    if (!photoId) return
    const index = photos.findIndex((photo) => photo.id === photoId)
    if (index >= 0) {
      queueMicrotask(() => {
        setCurrentIndex(index)
        setLightboxOpen(true)
      })
    }
  }, [photos, searchParams])

  const openLightbox = useCallback((photo: PhotoType) => {
    const index = photos.findIndex((p) => p.id === photo.id)
    setCurrentIndex(index)
    setLightboxOpen(true)
    updatePhotoParam(photo.id)
  }, [photos, updatePhotoParam])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
    updatePhotoParam()
  }, [updatePhotoParam])

  const navigate = useCallback((index: number) => {
    setCurrentIndex(index)
    updatePhotoParam(photos[index]?.id)
  }, [photos, updatePhotoParam])

  if (!photos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-6 opacity-20">◻</div>
        <p className="text-white/30 text-sm">{t.gallery.noPhotos}</p>
        <p className="text-white/10 text-xs mt-2">{t.gallery.noPhotosHint}</p>
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
