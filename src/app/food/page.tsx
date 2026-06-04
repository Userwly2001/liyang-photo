export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import type { Metadata } from 'next'

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
  const photos = await getFoodPhotos()
  return (
    <GalleryPageContent
      title="美食"
      subtitle="用镜头品味生活中的美好滋味"
      photos={photos}
      emptyMessage="美食作品即将上线"
    />
  )
}
