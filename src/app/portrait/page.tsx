export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import { getPublishedGroups, getPublishedPhotos } from '@/lib/gallery-data'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'

export const metadata: Metadata = {
  title: '人像作品 | LEONPHOTO',
  description: 'Leon Wang 的人像摄影作品集',
  alternates: { canonical: '/portrait' },
}

export default async function PortraitPage() {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
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
