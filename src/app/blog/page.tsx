export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BlogList from '@/components/Blog/BlogList'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { filterPostsByCategory, getBlogCategory, getTranslatedCategories } from '@/lib/blog-categories'
import { getDictionary } from '@/i18n/dictionaries'
import { COOKIE_NAME, DEFAULT_LANG, type Language } from '@/i18n/settings'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '随笔 | LEONPHOTO',
  description: 'Leon Wang 记录生活片段、成长感受和摄影思考的个人随笔',
}

interface BlogPageProps {
  searchParams?: Promise<{ category?: string }>
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

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const cookieStore = await cookies()
  const lang: Language = (cookieStore.get(COOKIE_NAME)?.value === 'en' ? 'en' : DEFAULT_LANG)
  const t = getDictionary(lang)

  const params = await searchParams
  const activeCategory = getBlogCategory(params?.category)
  const posts = await getPosts()
  const filteredPosts = filterPostsByCategory(posts, activeCategory.slug)
  const categories = getTranslatedCategories(t)

  // Find the translated category that matches the active slug
  const activeTranslated = categories.find(c => c.slug === activeCategory.slug) ?? categories[0]

  return (
    <div className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-16">
          <AnimatedSection>
            <p className="text-xs uppercase tracking-[0.3em] text-accent/55 mb-4">
              {t.blog.pageLabel}
            </p>
            <h1 className="mb-4 text-4xl font-semibold sm:text-6xl">
              {t.blog.pageTitle}
            </h1>
            <p className="text-sm text-foreground/45 max-w-md leading-relaxed">
              {t.blog.pageSubtitle}
            </p>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.1}>
          <div className="mb-14">
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((category) => {
                const active = category.slug === activeCategory.slug
                const href = category.slug === 'all' ? '/blog' : `/blog?category=${category.slug}`

                return (
                  <Link
                    key={category.slug}
                    href={href}
                    className={`px-4 py-2 rounded-sm text-sm transition-colors ${
                      active
                        ? 'bg-accent text-background'
                        : 'border border-accent/12 bg-foreground/[0.035] text-foreground/45 hover:border-accent/35 hover:text-foreground/75'
                    }`}
                  >
                    {category.label}
                  </Link>
                )
              })}
            </div>
            <p className="text-xs text-foreground/30 leading-relaxed">
              {activeTranslated.description}
            </p>
          </div>
        </AnimatedSection>

        <BlogList
          posts={filteredPosts}
          activeCategoryLabel={activeTranslated.label}
          lang={lang}
        />
      </div>
    </div>
  )
}
