export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import HomePortal from '@/components/Home/HomePortal'

async function getHomeData() {
  try {
    const [profile, featuredPhotos, photoCount, postCount] = await Promise.all([
      prisma.profile.findUnique({ where: { id: 'default' } }),
      prisma.$queryRaw<Array<{ imageUrl: string; title: string }>>`
        SELECT image_url AS "imageUrl", title
        FROM photos
        WHERE featured = true AND published = true
        ORDER BY RANDOM()
        LIMIT 3
      `,
      prisma.photo.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: true } }),
    ])

    return { profile, featuredPhotos, photoCount, postCount }
  } catch {
    return {
      profile: null,
      featuredPhotos: [],
      photoCount: 0,
      postCount: 0,
    }
  }
}

export default async function HomePage() {
  const { profile, featuredPhotos, photoCount, postCount } = await getHomeData()
  const heroPhoto = featuredPhotos[0] || (profile?.heroImage
    ? {
        imageUrl: profile.heroImage,
        title: '',
      }
    : undefined)
  const galleryPhoto = profile?.galleryImage ? { imageUrl: profile.galleryImage, title: 'Gallery' } : undefined
  const journalPhoto = profile?.journalImage ? { imageUrl: profile.journalImage, title: 'Notes' } : undefined

  return (
    <HomePortal
      name={profile?.name || ''}
      title={profile?.title || ''}
      bio={profile?.bio || ''}
      location={profile?.location}
      heroPhoto={heroPhoto}
      galleryPhoto={galleryPhoto}
      journalPhoto={journalPhoto}
      photoCount={photoCount}
      postCount={postCount}
    />
  )
}
