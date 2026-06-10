import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost'

  const staticRoutes = ['', '/gallery', '/portrait', '/landscape', '/food', '/blog', '/guestbook', '/about'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }))

  try {
    const [posts, groups] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.photoGroup.findMany({
        where: { published: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
      })),
      ...groups.map((group) => ({
        url: `${siteUrl}/gallery/group/${group.id}`,
        lastModified: group.updatedAt,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
