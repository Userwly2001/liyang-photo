'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { getPostCategory } from '@/lib/blog-categories'
import type { BlogPostType } from '@/types'

interface BlogListProps {
  posts: BlogPostType[]
  activeCategoryLabel?: string
}

export default function BlogList({ posts, activeCategoryLabel = '全部' }: BlogListProps) {
  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-foreground/32 text-sm">暂无{activeCategoryLabel}内容</p>
        <p className="text-foreground/14 text-xs mt-2">发布后的文字会在这里慢慢长出来</p>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {posts.map((post, i) => (
        <AnimatedSection key={post.id} delay={i * 0.1}>
          <Link href={`/blog/${post.slug}`}>
            <article className="group border-b border-accent/10 pb-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {post.coverImage && (
                  <div className="sm:w-48 h-32 rounded-sm overflow-hidden bg-surface flex-shrink-0 ring-1 ring-accent/10">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                      style={{ backgroundImage: `url(${post.coverImage})` }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/24 mb-3">
                    <span className="text-accent/60">{getPostCategory(post).label}</span>
                    <span>·</span>
                    <time dateTime={post.createdAt}>
                      {new Date(post.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                    {post.tags.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{post.tags[0]}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-foreground/86 group-hover:text-foreground transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-foreground/34 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  {post.tags.length > 1 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-sm bg-foreground/[0.035] text-[11px] text-foreground/28"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-accent/35 group-hover:text-accent/70 transition-colors">
                    <span>阅读</span>
                    <span className="text-lg leading-none group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        </AnimatedSection>
      ))}
    </div>
  )
}
