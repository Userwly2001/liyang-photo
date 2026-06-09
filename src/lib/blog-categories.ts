import type { BlogPostType } from '@/types'
import type { Dictionary } from '@/i18n/types'

// Data-only category definitions (slugs and tags only, no UI labels)
export const blogCategorySlugs = ['all', 'photo', 'life', 'city', 'work'] as const

export type BlogCategorySlug = (typeof blogCategorySlugs)[number]

export interface BlogCategoryData {
  slug: BlogCategorySlug
  tags: string[]
}

export const blogCategoryData: BlogCategoryData[] = [
  { slug: 'all', tags: [] },
  { slug: 'photo', tags: ['摄影', '器材', '后期', '拍摄', '镜头', '作品'] },
  { slug: 'life', tags: ['生活', '随笔', '日常', '感受', '心情'] },
  { slug: 'city', tags: ['城市', '旅行', '街头', '行走', '风景'] },
  { slug: 'work', tags: ['作品笔记', '作品', '照片', '组图'] },
]

export interface BlogCategory {
  slug: BlogCategorySlug
  label: string
  description: string
  tags: string[]
}

export function getTranslatedCategories(t: Dictionary): BlogCategory[] {
  return [
    {
      slug: 'all',
      label: t.blog.allLabel,
      description: t.blog.allDesc,
      tags: [],
    },
    {
      slug: 'photo',
      label: t.blog.categories.photo.label,
      description: t.blog.categories.photo.desc,
      tags: blogCategoryData.find(c => c.slug === 'photo')!.tags,
    },
    {
      slug: 'life',
      label: t.blog.categories.life.label,
      description: t.blog.categories.life.desc,
      tags: blogCategoryData.find(c => c.slug === 'life')!.tags,
    },
    {
      slug: 'city',
      label: t.blog.categories.city.label,
      description: t.blog.categories.city.desc,
      tags: blogCategoryData.find(c => c.slug === 'city')!.tags,
    },
    {
      slug: 'work',
      label: t.blog.categories.work.label,
      description: t.blog.categories.work.desc,
      tags: blogCategoryData.find(c => c.slug === 'work')!.tags,
    },
  ]
}

// Legacy: for components that already import blogCategories
export const blogCategories = [
  {
    slug: 'all' as const,
    label: '全部',
    description: '影像、生活、城市和一些未完成的想法',
    tags: [] as string[],
  },
  {
    slug: 'photo' as const,
    label: '摄影手记',
    description: '拍摄复盘、器材体验、后期思路和作品背后的故事',
    tags: ['摄影', '器材', '后期', '拍摄', '镜头', '作品'],
  },
  {
    slug: 'life' as const,
    label: '生活随笔',
    description: '日常感受、私人观察、情绪记录和缓慢发生的变化',
    tags: ['生活', '随笔', '日常', '感受', '心情'],
  },
  {
    slug: 'city' as const,
    label: '城市与行走',
    description: '旅行、街道、城市片段和路上的光',
    tags: ['城市', '旅行', '街头', '行走', '风景'],
  },
  {
    slug: 'work' as const,
    label: '作品笔记',
    description: '一组照片、一段时间、一次按下快门前后的想法',
    tags: ['作品笔记', '作品', '照片', '组图'],
  },
] as const

export function getBlogCategory(slug?: string) {
  return blogCategories.find((category) => category.slug === slug) ?? blogCategories[0]
}

export function getPostCategory(post: Pick<BlogPostType, 'tags'>): { label: string; slug: string } {
  const category = blogCategories.find((category) => {
    if (category.slug === 'all') return false
    return category.tags.some((tag) => post.tags.includes(tag))
  })
  return category ?? blogCategories[1]
}

export function filterPostsByCategory(posts: BlogPostType[], categorySlug?: string) {
  const category = getBlogCategory(categorySlug)
  if (category.slug === 'all') return posts

  return posts.filter((post) => category.tags.some((tag) => post.tags.includes(tag)))
}
