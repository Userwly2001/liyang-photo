import { prisma } from '@/lib/prisma'
import { absoluteUrl, SITE_URL } from '@/lib/site'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/gallery', '/portrait', '/landscape', '/food', '/blog', '/guestbook', '/about'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '/blog' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/gallery' || path === '/blog' ? 0.9 : 0.7,
  }))

  try {
    const [posts, groups, photos] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, coverImage: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.photoGroup.findMany({
        where: { published: true },
        select: {
          id: true,
          updatedAt: true,
          photos: { where: { published: true }, select: { imageUrl: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.photo.findMany({
        where: { published: true },
        select: { id: true, imageUrl: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        images: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
      })),
      ...groups.map((group) => ({
        url: `${SITE_URL}/gallery/group/${group.id}`,
        lastModified: group.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        images: group.photos.map((photo) => absoluteUrl(photo.imageUrl)),
      })),
      ...photos.map((photo) => ({
        url: `${SITE_URL}/gallery/photo/${photo.id}`,
        lastModified: photo.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        images: [absoluteUrl(photo.imageUrl)],
      })),
    ]
  } catch {
    return staticRoutes
  }
}
