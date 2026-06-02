export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import AnimatedSection from '@/components/ui/AnimatedSection'
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
  const profile = await getProfile()

  return (
    <div className="pt-28 pb-24 px-6 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection>
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">
              关于
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
              {profile?.name || 'Leon Wang'}
            </h1>
            <p className="text-sm text-white/40 max-w-md leading-relaxed">
              {profile?.title || '摄影师'}
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
              <p className="text-white/30">个人介绍即将更新...</p>
            )}
          </div>
        </AnimatedSection>

        {profile && (profile.email || profile.location || profile.instagram || profile.wechat) && (
          <AnimatedSection delay={0.2}>
            <div className="mt-16 pt-12 border-t border-white/10">
              <h3 className="text-sm font-medium mb-6">联系方式</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {profile.email && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">邮箱</span>
                    <span className="text-white/50">{profile.email}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">城市</span>
                    <span className="text-white/50">{profile.location}</span>
                  </div>
                )}
                {profile.instagram && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">Instagram</span>
                    <span className="text-white/50">{profile.instagram}</span>
                  </div>
                )}
                {profile.wechat && (
                  <div className="flex items-center gap-3 text-white/40">
                    <span className="text-white/20 text-xs w-12">微信</span>
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
