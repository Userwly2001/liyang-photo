import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const groups = await prisma.photoGroup.findMany({
      include: {
        photos: {
          select: { id: true, title: true, imageUrl: true, thumbnailUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      success: true,
      data: groups.map((group) => ({
        ...group,
        shotAt: group.shotAt?.toISOString() || null,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/admin/groups error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    if (!title || !category) {
      return NextResponse.json({ success: false, error: '标题和分类不能为空' }, { status: 400 })
    }

    const group = await prisma.photoGroup.create({
      data: {
        title,
        category,
        description: cleanOptional(body.description),
        location: cleanOptional(body.location),
        shotAt: parseOptionalDate(body.shotAt),
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
        published: body.published !== false,
      },
    })

    return NextResponse.json({ success: true, data: group }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/groups error:', error)
    return NextResponse.json({ success: false, error: '创建作品组失败' }, { status: 500 })
  }
}

function cleanOptional(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseOptionalDate(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}
