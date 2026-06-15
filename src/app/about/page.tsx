export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { getDictionary } from '@/i18n/dictionaries'
import { localizedMetadata } from '@/i18n/metadata'
import { getRequestLanguage } from '@/i18n/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return localizedMetadata(await getRequestLanguage(), 'about', '/about')
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
  const lang = await getRequestLanguage()
  const t = getDictionary(lang)
  const profile = await getProfile()

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <div className="mb-16 border-b border-accent/15 pb-12 sm:mb-20 sm:pb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-accent/60 mb-5">
              {t.about.pageLabel}
            </p>
            <h1 className="mb-5 text-5xl font-semibold sm:text-7xl">
              {profile?.name || t.about.nameFallback}
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-accent/75 sm:text-sm">
              {t.about.identity}
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="grid gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/25">{profile?.location || 'Shenzhen'}</p>
              <p className="mt-3 text-sm leading-7 text-white/40">{profile?.title || t.about.titleFallback}</p>
            </div>
            <div className="max-w-2xl">
              <p className="text-xl leading-9 text-white/78 sm:text-2xl sm:leading-10">{t.about.intro}</p>
              <p className="mt-6 text-base leading-8 text-white/52">{t.about.introSecond}</p>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.16}>
          <div className="mt-16 border-t border-white/10 pt-12 prose prose-invert max-w-none prose-p:text-white/50 prose-p:leading-relaxed prose-a:text-white/60 prose-strong:text-white/70">
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
