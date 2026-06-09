export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于 | LEONPHOTO',
  description: '了解 Leon Wang 和他的摄影之旅',
}

async function getProfile() {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: 'default' } })
    return profile
  } catch {
    return null
  }
}

export default async function AboutPage() {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
  const t = getDictionary(lang)
  const profile = await getProfile()

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection>
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">
              {t.about.pageLabel}
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
              {profile?.name || t.about.nameFallback}
            </h1>
            <p className="text-sm text-white/40 max-w-md leading-relaxed">
              {profile?.title || t.about.titleFallback}
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="prose prose-invert max-w-none prose-p:text-white/50 prose-p:leading-relaxed prose-a:text-white/60 prose-strong:text-white/70">
            {profile?.bio ? (
              <div className="whitespace-pre-wrap text-white/50 leading-relaxed">
                {profile.bio}
              </div>
            ) : (
              <p className="text-white/30">{t.about.bioFallback}</p>
            )}
          </div>
        </AnimatedSection>

        {profile && (profile.email || profile.location || profile.instagram || profile.wechat) && (
          <AnimatedSection delay={0.2}>
            <div className="mt-16 pt-12 border-t border-white/10">
              <h3 className="text-sm font-medium mb-6">{t.about.contactHeading}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {profile.email && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">{t.about.email}</span>
                    <span className="text-white/50">{profile.email}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">{t.about.city}</span>
                    <span className="text-white/50">{profile.location}</span>
                  </div>
                )}
                {profile.instagram && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">{t.about.instagram}</span>
                    <span className="text-white/50">{profile.instagram}</span>
                  </div>
                )}
                {profile.wechat && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">{t.about.wechat}</span>
                    <span className="text-white/50">{profile.wechat}</span>
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  )
}
