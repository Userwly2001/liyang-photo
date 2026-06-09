import { prisma } from '@/lib/prisma'
import BlogPostContent from '@/components/Blog/BlogPostContent'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

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
  }
}

export default async function BlogPostPage({ params }: Props) {
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
    />
  )
}
