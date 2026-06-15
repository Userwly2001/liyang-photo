export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { mapPhoto } from '@/lib/gallery-data'
import PhotoGrid from '@/components/Gallery/PhotoGrid'
import GroupShareButton from '@/components/Gallery/GroupShareButton'
import { getDictionary } from '@/i18n/dictionaries'
import { getRequestLanguage } from '@/i18n/server'
import { absoluteUrl } from '@/lib/site'

async function getGroup(id: string) {
  try {
    return await prisma.photoGroup.findFirst({
      where: { id, published: true },
      include: {
        photos: {
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const group = await getGroup(id)
  if (!group) return { title: '作品组未找到 | LEONPHOTO' }
  const cover = group.photos.find((photo) => photo.id === group.coverPhotoId) || group.photos[0]
  return {
    title: `${group.title} | LEONPHOTO`,
    description: group.description || `${group.title} 摄影作品组`,
    alternates: { canonical: `/gallery/group/${group.id}` },
    openGraph: {
      title: group.title,
      description: group.description || `${group.title} 摄影作品组`,
      url: `/gallery/group/${group.id}`,
      images: cover ? [absoluteUrl(cover.imageUrl)] : undefined,
    },
    twitter: cover ? { card: 'summary_large_image', images: [absoluteUrl(cover.imageUrl)] } : undefined,
  }
}

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const group = await getGroup(id)
  if (!group) notFound()

  const lang = await getRequestLanguage()
  const t = getDictionary(lang)
  const cover = group.photos.find((photo) => photo.id === group.coverPhotoId) || group.photos[0]
  const photos = group.photos.map(mapPhoto)

  return (
    <main className="min-h-screen pb-24 pt-24">
      <section className="px-5 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between gap-5 text-xs">
            <Link href={`/${group.category === 'landscape' ? 'landscape' : group.category === 'portrait' ? 'portrait' : group.category === 'food' ? 'food' : 'gallery'}`} className="text-foreground/40 transition-colors hover:text-accent">
              ← {t.gallery.backToGallery}
            </Link>
            <GroupShareButton title={group.title} />
          </div>

          <div className="relative min-h-[56vh] overflow-hidden bg-white/[0.025]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.imageUrl} alt={group.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.24em] text-foreground/15">
                {t.gallery.awaitingPhotos}
              </div>
            )}
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative flex min-h-[56vh] items-end p-6 sm:p-10 lg:p-14">
              <div className="max-w-2xl">
                <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-accent">{group.category} / {photos.length} {t.gallery.frames}</p>
                <h1 className="text-4xl font-semibold sm:text-6xl lg:text-7xl">{group.title}</h1>
                {(group.description || group.location || group.shotAt) && (
                  <div className="mt-6 border-l border-accent/50 pl-5">
                    {group.description && <p className="max-w-xl text-sm leading-7 text-white/65">{group.description}</p>}
                    {(group.location || group.shotAt) && (
                      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/40">
                        {[group.location, group.shotAt?.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 px-5 sm:mt-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-foreground/35">{t.gallery.viewPhotos}</p>
            <span className="text-[10px] text-accent/55">{photos.length} {t.gallery.frames}</span>
          </div>
          <PhotoGrid photos={photos} />
        </div>
      </section>
    </main>
  )
}
