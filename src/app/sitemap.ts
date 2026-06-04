import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost'

  const staticRoutes = ['', '/portrait', '/landscape', '/food', '/blog', '/guestbook', '/about'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }))

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })

    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
