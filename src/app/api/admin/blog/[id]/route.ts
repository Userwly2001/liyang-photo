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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.title?.trim()) data.title = body.title.trim()
    if (body.slug?.trim()) data.slug = body.slug.trim()
    if (body.content?.trim()) data.content = body.content.trim()
    if (body.excerpt !== undefined) data.excerpt = body.excerpt?.trim() || null
    if (body.tags !== undefined) {
      data.tags = Array.isArray(body.tags) ? body.tags : body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    }
    if (body.published !== undefined) data.published = body.published

    const post = await prisma.blogPost.update({ where: { id }, data })

    return NextResponse.json({
      success: true,
      data: { ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString() },
    })
  } catch (error) {
    console.error('PUT /api/admin/blog/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/blog/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
}
