export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import type { Metadata } from 'next'

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
      createdAt: p.createdAt.toISOString(),
    }))
  } catch {
    return []
  }
}

export default async function GalleryPage() {
  const photos = await getPhotos()

  return (
    <GalleryPageContent
      title="相册"
      subtitle="人像、风景、美食与城市片段，按下快门后留在这里。"
      photos={photos}
      emptyMessage="相册正在等待第一张照片"
    />
  )
}
