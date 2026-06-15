import { prisma } from '@/lib/prisma'
import BlogPostContent from '@/components/Blog/BlogPostContent'
import { notFound } from 'next/navigation'
import { getRequestLanguage } from '@/i18n/server'
import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/site'

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug, published: true },
    })
    return post
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: '未找到 | LEONPHOTO' }
  return {
    title: `${post.title} | LEONPHOTO 随笔`,
    description: post.excerpt || post.title,
    keywords: [...post.tags, 'Leon Wang', '生活随笔'],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.title,
      images: post.coverImage ? [absoluteUrl(post.coverImage)] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const lang = await getRequestLanguage()

  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <BlogPostContent
      title={post.title}
      content={post.content}
      createdAt={post.createdAt.toISOString()}
      tags={post.tags}
      lang={lang}
    />
  )
}
