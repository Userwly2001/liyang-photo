import { prisma } from '@/lib/prisma'
import type { PhotoGroupType, PhotoType } from '@/types'

export async function getPublishedPhotos(category?: string): Promise<PhotoType[]> {
  try {
    const photos = await prisma.photo.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      orderBy: { sortOrder: 'asc' },
    })
    return photos.map(mapPhoto)
  } catch {
    return []
  }
}

export async function getPublishedGroups(category?: string): Promise<PhotoGroupType[]> {
  try {
    const groups = await prisma.photoGroup.findMany({
      where: { published: true, ...(category ? { category } : {}) },
      include: {
        photos: {
          where: { published: true },
          select: { id: true, imageUrl: true, thumbnailUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return groups.map((group) => {
      const cover = group.photos.find((photo) => photo.id === group.coverPhotoId) || group.photos[0]
      return {
        id: group.id,
        title: group.title,
        description: group.description ?? undefined,
        category: group.category,
        coverPhotoId: group.coverPhotoId ?? undefined,
        coverImage: cover?.thumbnailUrl || cover?.imageUrl,
        location: group.location ?? undefined,
        shotAt: group.shotAt?.toISOString(),
        sortOrder: group.sortOrder,
        published: group.published,
        photoCount: group.photos.length,
        createdAt: group.createdAt.toISOString(),
      }
    })
  } catch {
    return []
  }
}

export function mapPhoto(photo: {
  id: string
  title: string
  description: string | null
  category: string
  imageUrl: string
  thumbnailUrl: string | null
  originalUrl: string | null
  blurHash: string | null
  width: number | null
  height: number | null
  focalLength: string | null
  aperture: string | null
  iso: string | null
  shutterSpeed: string | null
  camera: string | null
  lens: string | null
  tags: string[]
  featured: boolean
  sortOrder: number
  likeCount: number
  groupId: string | null
  createdAt: Date
}): PhotoType {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description ?? undefined,
    category: photo.category,
    imageUrl: photo.imageUrl,
    thumbnailUrl: photo.thumbnailUrl ?? undefined,
    originalUrl: photo.originalUrl ?? undefined,
    blurHash: photo.blurHash ?? undefined,
    width: photo.width ?? undefined,
    height: photo.height ?? undefined,
    focalLength: photo.focalLength ?? undefined,
    aperture: photo.aperture ?? undefined,
    iso: photo.iso ?? undefined,
    shutterSpeed: photo.shutterSpeed ?? undefined,
    camera: photo.camera ?? undefined,
    lens: photo.lens ?? undefined,
    tags: photo.tags,
    featured: photo.featured,
    sortOrder: photo.sortOrder,
    likeCount: photo.likeCount,
    groupId: photo.groupId ?? undefined,
    createdAt: photo.createdAt.toISOString(),
  }
}
