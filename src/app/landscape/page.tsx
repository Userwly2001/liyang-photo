export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import { getPublishedGroups, getPublishedPhotos } from '@/lib/gallery-data'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'

export const metadata: Metadata = {
  title: '风光作品 | LEONPHOTO',
  description: 'Leon Wang 的风光摄影作品集',
  alternates: { canonical: '/landscape' },
}

export default async function LandscapePage() {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
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
