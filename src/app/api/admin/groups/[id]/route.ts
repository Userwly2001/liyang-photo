import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdmin } from '@/lib/admin-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    if (!title || !category) {
      return NextResponse.json({ success: false, error: '标题和分类不能为空' }, { status: 400 })
    }

    const requestedCoverId = cleanOptional(body.coverPhotoId)
    if (requestedCoverId) {
      const cover = await prisma.photo.findFirst({ where: { id: requestedCoverId, groupId: id, category } })
      if (!cover) {
        return NextResponse.json({ success: false, error: '封面必须选择组内照片' }, { status: 400 })
      }
    }

    const group = await prisma.$transaction(async (tx) => {
      await tx.photo.updateMany({
        where: { groupId: id, category: { not: category } },
        data: { groupId: null },
      })
      return tx.photoGroup.update({
        where: { id },
        data: {
          title,
          category,
          description: cleanOptional(body.description),
          location: cleanOptional(body.location),
          shotAt: parseOptionalDate(body.shotAt),
          coverPhotoId: requestedCoverId,
          sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
          published: body.published !== false,
        },
      })
    })

    return NextResponse.json({ success: true, data: group })
  } catch (error) {
    console.error('PUT /api/admin/groups/[id] error:', error)
    return NextResponse.json({ success: false, error: '更新作品组失败' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.$transaction([
      prisma.photo.updateMany({ where: { groupId: id }, data: { groupId: null } }),
      prisma.photoGroup.delete({ where: { id } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/groups/[id] error:', error)
    return NextResponse.json({ success: false, error: '删除作品组失败' }, { status: 500 })
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
