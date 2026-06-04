import type { BlogPostType } from '@/types'

export const blogCategories = [
  {
    slug: 'all',
    label: '全部',
    description: '影像、生活、城市和一些未完成的想法',
    tags: [],
  },
  {
    slug: 'photo',
    label: '摄影手记',
    description: '拍摄复盘、器材体验、后期思路和作品背后的故事',
    tags: ['摄影', '器材', '后期', '拍摄', '镜头', '作品'],
  },
  {
    slug: 'life',
    label: '生活随笔',
    description: '日常感受、私人观察、情绪记录和缓慢发生的变化',
    tags: ['生活', '随笔', '日常', '感受', '心情'],
  },
  {
    slug: 'city',
    label: '城市与行走',
    description: '旅行、街道、城市片段和路上的光',
    tags: ['城市', '旅行', '街头', '行走', '风景'],
  },
  {
    slug: 'work',
    label: '作品笔记',
    description: '一组照片、一段时间、一次按下快门前后的想法',
    tags: ['作品笔记', '作品', '照片', '组图'],
  },
] as const

export type BlogCategorySlug = (typeof blogCategories)[number]['slug']

export function getBlogCategory(slug?: string) {
  return blogCategories.find((category) => category.slug === slug) ?? blogCategories[0]
}

export function getPostCategory(post: Pick<BlogPostType, 'tags'>) {
  return (
    blogCategories.find((category) => {
      if (category.slug === 'all') return false
      return category.tags.some((tag) => post.tags.includes(tag))
    }) ?? blogCategories[1]
  )
}

export function filterPostsByCategory(posts: BlogPostType[], categorySlug?: string) {
  const category = getBlogCategory(categorySlug)
  if (category.slug === 'all') return posts

  return posts.filter((post) => category.tags.some((tag) => post.tags.includes(tag)))
}
