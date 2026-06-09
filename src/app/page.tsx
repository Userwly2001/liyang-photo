export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import HomePortal from '@/components/Home/HomePortal'

async function getHomeData() {
  try {
    const [profile, featuredPhotos, latestPost, photoCount, postCount] = await Promise.all([
      prisma.profile.findUnique({ where: { id: 'default' } }),
      prisma.photo.findMany({
        where: { featured: true, published: true },
        orderBy: { sortOrder: 'asc' },
        take: 3,
        select: { imageUrl: true, title: true },
      }),
      prisma.blogPost.findFirst({
        where: { published: true, coverImage: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { coverImage: true, title: true },
      }),
      prisma.photo.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: true } }),
    ])

    return { profile, featuredPhotos, latestPost, photoCount, postCount }
  } catch {
    return {
      profile: null,
      featuredPhotos: [],
      latestPost: null,
      photoCount: 0,
      postCount: 0,
    }
  }
}

export default async function HomePage() {
  const { profile, featuredPhotos, latestPost, photoCount, postCount } = await getHomeData()
  const heroPhoto = profile?.heroImage
    ? {
        imageUrl: profile.heroImage,
        title: '首页封面',
      }
    : featuredPhotos[0]
  const journalPhoto = latestPost?.coverImage
    ? { imageUrl: latestPost.coverImage, title: latestPost.title }
    : featuredPhotos[2]

  return (
    <HomePortal
      name={profile?.name || 'Leon Wang'}
      title={profile?.title || '摄影与生活记录者'}
      bio={profile?.bio || ''}
      location={profile?.location}
      heroPhoto={heroPhoto}
      galleryPhoto={featuredPhotos[1] || featuredPhotos[0]}
      journalPhoto={journalPhoto}
      photoCount={photoCount}
      postCount={postCount}
    />
  )
}
