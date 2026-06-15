export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { absoluteUrl } from '@/lib/site'
import { getDictionary } from '@/i18n/dictionaries'
import { getRequestLanguage } from '@/i18n/server'

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
  const lang = await getRequestLanguage()
  const t = getDictionary(lang)
  if (!photo) return { title: t.photoDetail.notFound, robots: { index: false } }
  const description = photo.description || t.photoDetail.description
    .replace('{title}', photo.title)
    .replace('{category}', photo.category)
  const image = absoluteUrl(photo.imageUrl)

  return {
    title: `${photo.title} | ${lang === 'zh' ? 'Leon Wang 摄影作品' : 'Leon Wang Photography'}`,
    description,
    keywords: [photo.title, photo.category, ...photo.tags, 'Leon Wang', lang === 'zh' ? '摄影' : 'Photography'],
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
  const lang = await getRequestLanguage()
  const t = getDictionary(lang)
  const description = photo.description || t.photoDetail.description
    .replace('{title}', photo.title)
    .replace('{category}', photo.category)
  const detailItems = [
    photo.camera && [t.photoDetail.camera, photo.camera],
    photo.lens && [t.photoDetail.lens, photo.lens],
    photo.focalLength && [t.photoDetail.focalLength, photo.focalLength],
    photo.aperture && [t.photoDetail.aperture, `f/${photo.aperture}`],
    photo.shutterSpeed && [t.photoDetail.shutterSpeed, photo.shutterSpeed],
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
            ← {photo.group?.published ? photo.group.title : t.photoDetail.backToGallery}
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={photo.originalUrl || photo.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-accent/25 px-3 py-2 text-accent/70 transition-colors hover:border-accent/55 hover:text-accent"
            >
              <span aria-hidden="true">↗</span>
              {photo.originalUrl ? t.lightbox.viewOriginal : t.lightbox.viewHighRes}
            </a>
            <a
              href={`/api/photos/${photo.id}/download`}
              className="inline-flex items-center gap-2 bg-accent px-3 py-2 text-black transition-colors hover:bg-accent/85"
            >
              <span aria-hidden="true">↓</span>
              {photo.originalUrl ? t.lightbox.download : t.lightbox.downloadHighRes}
            </a>
          </div>
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
