export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '人像作品 | LEONPHOTO',
  description: 'Leon Wang 的人像摄影作品集',
}

async function getPortraits() {
  try {
    const photos = await prisma.photo.findMany({
      where: { category: 'portrait', published: true },
      orderBy: { sortOrder: 'asc' },
    })
    return photos.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description ?? undefined,
      category: p.category,
      imageUrl: p.imageUrl,
      thumbnailUrl: p.thumbnailUrl ?? undefined,
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

export default async function PortraitPage() {
  const photos = await getPortraits()
  return (
    <GalleryPageContent
      title="人像"
      subtitle="用光影讲述每一个人的故事"
      photos={photos}
      emptyMessage="人像作品即将上线"
    />
  )
}
