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

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, data: categories })
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slug, label, sortOrder } = await request.json()
    if (!slug?.trim() || !label?.trim()) {
      return NextResponse.json({ success: false, error: 'Slug and label are required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { slug: slug.trim(), label: label.trim(), sortOrder: sortOrder || 0 },
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/categories error:', error)
    return NextResponse.json({ success: false, error: 'Category may already exist' }, { status: 409 })
  }
}

export async function DELETE(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 })
    }

    const usedByPhotos = await prisma.photo.count({ where: { category: slug } })
    const usedByGroups = await prisma.photoGroup.count({ where: { category: slug } })
    if (usedByPhotos > 0 || usedByGroups > 0) {
      return NextResponse.json(
        { success: false, error: `分类下还有 ${usedByPhotos} 张照片、${usedByGroups} 个作品组，请先移动或删除` },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { slug } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/categories error:', error)
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
}
