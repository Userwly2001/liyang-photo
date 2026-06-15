export const dynamic = 'force-dynamic'

import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import { getPublishedGroups, getPublishedPhotos } from '@/lib/gallery-data'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { localizedMetadata } from '@/i18n/metadata'
import { getRequestLanguage } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(await getRequestLanguage(), 'landscape', '/landscape')
}

export default async function LandscapePage() {
  const lang = await getRequestLanguage()
  const t = getDictionary(lang)

  const [photos, groups] = await Promise.all([getPublishedPhotos('landscape'), getPublishedGroups('landscape')])
  return (
    <GalleryPageContent
      title={t.gallery.navLandscape}
      subtitle={t.home.featured.landscape.desc}
      photos={photos}
      groups={groups}
      emptyMessage={t.gallery.emptyLandscape}
    />
  )
}
