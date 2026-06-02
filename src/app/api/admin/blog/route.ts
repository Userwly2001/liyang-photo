import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  try {
    const { jwtVerify } = await import('jose')
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
    const { payload } = await jwtVerify(authHeader.slice(7), secret)
    return (payload as { role?: string }).role === 'admin'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count(),
    ])

    return NextResponse.json({
      success: true,
      data: posts.map((p) => ({
        ...p,
        excerpt: p.excerpt ?? undefined,
        coverImage: p.coverImage ?? undefined,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/blog error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug, content, excerpt, tags, published } = body

    if (!title?.trim() || !slug?.trim() || !content?.trim()) {
      return NextResponse.json({ success: false, error: 'Title, slug and content are required' }, { status: 400 })
    }

    const post = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim() || null,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
        published: published ?? false,
      },
    })

    return NextResponse.json({
      success: true,
      data: { ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/blog error:', error)
    return NextResponse.json({ success: false, error: 'Slug may already exist' }, { status: 409 })
  }
}
