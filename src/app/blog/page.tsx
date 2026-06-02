export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import BlogList from '@/components/Blog/BlogList'
import AnimatedSection from '@/components/ui/AnimatedSection'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '博客 | LEONPHOTO',
  description: 'Leon Wang 的摄影博客',
}

async function getPosts() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    })
    return posts.map((p) => ({
      ...p,
      excerpt: p.excerpt ?? undefined,
      coverImage: p.coverImage ?? undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt?.toISOString() ?? undefined,
    }))
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="pt-28 pb-24 px-6 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-16">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">
              日志
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
              博客
            </h1>
            <p className="text-sm text-white/40 max-w-md leading-relaxed">
              关于摄影的思考、器材评测和镜头背后的故事
            </p>
          </AnimatedSection>
        </div>

        <BlogList posts={posts} />
      </div>
    </div>
  )
}
