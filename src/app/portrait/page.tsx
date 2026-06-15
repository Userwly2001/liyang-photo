export const dynamic = 'force-dynamic'

import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import { getPublishedGroups, getPublishedPhotos } from '@/lib/gallery-data'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { localizedMetadata } from '@/i18n/metadata'
import { getRequestLanguage } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(await getRequestLanguage(), 'portrait', '/portrait')
}

export default async function PortraitPage() {
  const lang = await getRequestLanguage()
  const t = getDictionary(lang)

  const [photos, groups] = await Promise.all([getPublishedPhotos('portrait'), getPublishedGroups('portrait')])
  return (
    <GalleryPageContent
      title={t.gallery.navPortrait}
      subtitle={t.home.featured.portrait.desc}
      photos={photos}
      groups={groups}
      emptyMessage={t.gallery.emptyPortrait}
    />
  )
}
