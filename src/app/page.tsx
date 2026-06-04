export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/Home/HeroSection'
import FeaturedPhotos from '@/components/Home/FeaturedPhotos'
import VisitHeatmap from '@/components/Home/VisitHeatmap'
import ParallaxSection from '@/components/Home/ParallaxSection'

async function getFeaturedPhotos() {
  try {
    const photos = await prisma.photo.findMany({
      where: { featured: true, published: true },
      orderBy: { sortOrder: 'asc' },
      take: 6,
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

async function getProfile() {
  try {
    return await prisma.profile.findUnique({ where: { id: 'default' } })
  } catch {
    return null
  }
}

export default async function HomePage() {
  const [photos, profile] = await Promise.all([getFeaturedPhotos(), getProfile()])
  const heroPhoto = profile?.heroImage
    ? {
        imageUrl: profile.heroImage,
        title: '',
        showCaption: false,
      }
    : photos[0]

  return (
    <>
      <HeroSection photo={heroPhoto} />
      <FeaturedPhotos photos={photos} />
      <VisitHeatmap />
      <ParallaxSection />
    </>
  )
}
