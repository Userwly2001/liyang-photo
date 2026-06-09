'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getPostCategory } from '@/lib/blog-categories'

interface BlogPostContentProps {
  title: string
  content: string
  createdAt: string
  tags: string[]
}

export default function BlogPostContent({
  title,
  content,
  createdAt,
  tags,
}: BlogPostContentProps) {
  const category = getPostCategory({ tags })

  return (
    <article className="min-h-screen px-5 pb-24 pt-28 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors mb-12"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回随笔
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/20 mb-4">
            <span className="text-white/45">{category.label}</span>
            <span>·</span>
            <time dateTime={createdAt}>
              {new Date(createdAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
            {title}
          </h1>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs bg-white/5 rounded-full text-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-white/60 prose-p:leading-relaxed prose-a:text-white/70 prose-a:no-underline hover:prose-a:text-white prose-img:rounded-lg prose-blockquote:border-white/20 prose-blockquote:text-white/40 prose-strong:text-white/80 prose-code:text-white/60 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-surface prose-pre:border prose-pre:border-white/10"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </motion.div>
      </div>
    </article>
  )
}
