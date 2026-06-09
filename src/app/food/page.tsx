export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'

export const metadata: Metadata = {
  title: '美食作品 | LEONPHOTO',
  description: 'Leon Wang 的美食摄影作品集',
}

async function getFoodPhotos() {
  try {
    const photos = await prisma.photo.findMany({
      where: { category: 'food', published: true },
      orderBy: { sortOrder: 'asc' },
    })
    return photos.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? undefined,
      category: p.category,
      imageUrl: p.imageUrl,
      thumbnailUrl: p.thumbnailUrl ?? undefined,
      originalUrl: p.originalUrl ?? undefined,
      blurHash: p.blurHash ?? undefined,
      width: p.width ?? undefined,
      height: p.height ?? undefined,
      focalLength: p.focalLength ?? undefined,
      aperture: p.aperture ?? undefined,
      iso: p.iso ?? undefined,
      shutterSpeed: p.shutterSpeed ?? undefined,
      camera: p.camera ?? undefined,
      lens: p.lens ?? undefined,
      tags: p.tags,
      featured: p.featured,
      sortOrder: p.sortOrder,
      createdAt: p.createdAt.toISOString(),
    }))
  } catch {
    return []
  }
}

export default async function FoodPage() {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
  const t = getDictionary(lang)

  const photos = await getFoodPhotos()
  return (
    <GalleryPageContent
      title={t.gallery.navFood}
      subtitle={t.home.featured.food.desc}
      photos={photos}
      emptyMessage={t.gallery.emptyFood}
    />
  )
}
