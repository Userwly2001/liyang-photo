'use client'

import Link from 'next/link'
import AnimatedSection from '@/components/ui/AnimatedSection'
import type { BlogPostType } from '@/types'

interface BlogListProps {
  posts: BlogPostType[]
}

export default function BlogList({ posts }: BlogListProps) {
  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-white/30 text-sm">暂无文章</p>
        <p className="text-white/10 text-xs mt-2">发布后的文章将在此展示</p>
      </div>
    )
  }

  return (
    <div className="space-y-16">
      {posts.map((post, i) => (
        <AnimatedSection key={post.id} delay={i * 0.1}>
          <Link href={`/blog/${post.slug}`}>
            <article className="group border-b border-white/5 pb-8">
              <div className="flex flex-col sm:flex-row gap-6">
                {post.coverImage && (
                  <div className="sm:w-48 h-32 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                      style={{ backgroundImage: `url(${post.coverImage})` }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-xs text-white/20 mb-3">
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
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-white/80 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-white/30 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-white/20 group-hover:text-white/50 transition-colors">
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
