export const dynamic = 'force-dynamic'

import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import { getPublishedGroups, getPublishedPhotos } from '@/lib/gallery-data'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { localizedMetadata } from '@/i18n/metadata'
import { getRequestLanguage } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(await getRequestLanguage(), 'food', '/food')
}

export default async function FoodPage() {
  const lang = await getRequestLanguage()
  const t = getDictionary(lang)

  const [photos, groups] = await Promise.all([getPublishedPhotos('food'), getPublishedGroups('food')])
  return (
    <GalleryPageContent
      title={t.gallery.navFood}
      subtitle={t.home.featured.food.desc}
      photos={photos}
      groups={groups}
      emptyMessage={t.gallery.emptyFood}
    />
  )
}
