export interface PhotoType {
  id: string
  title: string
  description?: string
  category: string
  imageUrl: string
  thumbnailUrl?: string
  originalUrl?: string
  blurHash?: string
  width?: number
  height?: number
  focalLength?: string
  aperture?: string
  iso?: string
  shutterSpeed?: string
  camera?: string
  lens?: string
  tags: string[]
  featured: boolean
  sortOrder: number
  likeCount: number
  createdAt: string
}

export interface BlogPostType {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  tags: string[]
  published: boolean
  createdAt: string
  updatedAt?: string
}

export interface MessageType {
  id: string
  nickname: string
  content: string
  images: string[]
  type: 'comment' | 'photo_share'
  photoId?: string
  parentId?: string
  replies?: MessageType[]
  status: 'pending' | 'approved' | 'rejected'
  ip?: string
  userAgent?: string
  createdAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  totalPages: number
}
