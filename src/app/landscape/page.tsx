export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '风光作品 | LEONPHOTO',
  description: 'Leon Wang 的风光摄影作品集',
}

async function getLandscapes() {
  try {
    const photos = await prisma.photo.findMany({
      where: { category: 'landscape', published: true },
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

export default async function LandscapePage() {
  const photos = await getLandscapes()
  return (
    <GalleryPageContent
      title="风光"
      subtitle="在静谧中感受大自然的壮丽"
      photos={photos}
      emptyMessage="风光作品即将上线"
    />
  )
}
