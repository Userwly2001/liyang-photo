export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'

export const metadata: Metadata = {
  title: '相册 | LEONPHOTO',
  description: 'Leon Wang 的摄影作品合集',
}

async function getPhotos() {
  try {
    const photos = await prisma.photo.findMany({
      where: { published: true },
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
      likeCount: p.likeCount,
      createdAt: p.createdAt.toISOString(),
    }))
  } catch {
    return []
  }
}

export default async function GalleryPage() {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
  const t = getDictionary(lang)
  const photos = await getPhotos()

  return (
    <GalleryPageContent
      title={t.gallery.navAll === '全部' ? '相册' : 'Gallery'}
      subtitle={lang === 'zh' ? '人像、风景、美食与城市片段，按下快门后留在这里。' : 'Portraits, landscapes, food, and city fragments — left here after pressing the shutter.'}
      photos={photos}
      emptyMessage={lang === 'zh' ? '相册正在等待第一张照片' : 'Gallery is waiting for its first photo'}
    />
  )
}
