export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import GalleryPageContent from '@/components/Gallery/GalleryPageContent'
import { getPublishedGroups, getPublishedPhotos } from '@/lib/gallery-data'
import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'

export const metadata: Metadata = {
  title: '相册 | LEONPHOTO',
  description: 'Leon Wang 的摄影作品合集',
  alternates: { canonical: '/gallery' },
}

export default async function GalleryPage() {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
  const t = getDictionary(lang)
  const [photos, groups] = await Promise.all([getPublishedPhotos(), getPublishedGroups()])

  return (
    <GalleryPageContent
      title={t.gallery.navAll === '全部' ? '相册' : 'Gallery'}
      subtitle={lang === 'zh' ? '人像、风景、美食与城市片段，按下快门后留在这里。' : 'Portraits, landscapes, food, and city fragments — left here after pressing the shutter.'}
      photos={photos}
      groups={groups}
      emptyMessage={lang === 'zh' ? '相册正在等待第一张照片' : 'Gallery is waiting for its first photo'}
    />
  )
}
