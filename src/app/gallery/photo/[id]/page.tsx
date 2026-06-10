export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { absoluteUrl } from '@/lib/site'

async function getPhoto(id: string) {
  try {
    return await prisma.photo.findFirst({
      where: { id, published: true },
      include: { group: { select: { id: true, title: true, published: true } } },
    })
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const photo = await getPhoto(id)
  if (!photo) return { title: '照片未找到 | LEONPHOTO', robots: { index: false } }
  const description = photo.description || `${photo.title}，Leon Wang 拍摄的${photo.category}摄影作品。`
  const image = absoluteUrl(photo.imageUrl)

  return {
    title: `${photo.title} | Leon Wang 摄影作品`,
    description,
    keywords: [photo.title, photo.category, ...photo.tags, 'Leon Wang', '摄影'],
    alternates: { canonical: `/gallery/photo/${photo.id}` },
    openGraph: {
      title: photo.title,
      description,
      type: 'article',
      url: `/gallery/photo/${photo.id}`,
      images: [{ url: image, width: photo.width || undefined, height: photo.height || undefined, alt: description }],
    },
    twitter: { card: 'summary_large_image', title: photo.title, description, images: [image] },
  }
}

export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photo = await getPhoto(id)
  if (!photo) notFound()
  const description = photo.description || `${photo.title}，一张关于${photo.category}的摄影作品。`
  const detailItems = [
    photo.camera && ['相机', photo.camera],
    photo.lens && ['镜头', photo.lens],
    photo.focalLength && ['焦距', photo.focalLength],
    photo.aperture && ['光圈', `f/${photo.aperture}`],
    photo.shutterSpeed && ['快门', photo.shutterSpeed],
    photo.iso && ['ISO', photo.iso],
  ].filter(Boolean) as string[][]

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Photograph',
    name: photo.title,
    description,
    contentUrl: absoluteUrl(photo.imageUrl),
    thumbnailUrl: absoluteUrl(photo.thumbnailUrl || photo.imageUrl),
    creator: { '@type': 'Person', name: 'Leon Wang', url: absoluteUrl('/about') },
    dateCreated: photo.createdAt.toISOString(),
    keywords: photo.tags.join(', '),
  }

  return (
    <main className="min-h-screen px-5 pb-24 pt-24 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <article className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <Link href={photo.group?.published ? `/gallery/group/${photo.group.id}` : '/gallery'} className="text-foreground/40 transition-colors hover:text-accent">
            ← {photo.group?.published ? photo.group.title : '返回相册'}
          </Link>
          <a href={photo.originalUrl || photo.imageUrl} className="border-b border-accent/35 pb-1 text-accent/70 hover:text-accent">
            {photo.originalUrl ? '查看原图' : '查看高清图'}
          </a>
        </div>

        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.imageUrl} alt={description} className="max-h-[82vh] w-full bg-surface object-contain" />
          <figcaption className="mt-8 grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-accent/65">{photo.category}</p>
              <h1 className="text-3xl font-semibold sm:text-5xl">{photo.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-foreground/52">{description}</p>
              {photo.tags.length > 0 && (
                <p className="mt-5 text-xs text-foreground/30">{photo.tags.map((tag) => `#${tag}`).join('  ')}</p>
              )}
            </div>
            {detailItems.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-l border-accent/20 pl-5 text-xs">
                {detailItems.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-foreground/25">{label}</dt>
                    <dd className="mt-1 text-foreground/60">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </figcaption>
        </figure>
      </article>
    </main>
  )
}
