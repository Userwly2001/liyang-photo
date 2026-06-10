import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

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
    const formData = await request.formData()

    const data: Record<string, unknown> = {}
    const title = (formData.get('title') as string)?.trim()
    if (title) data.title = title
    const description = (formData.get('description') as string)?.trim()
    if (description !== undefined) data.description = description || null
    const category = (formData.get('category') as string)?.trim()
    if (category) data.category = category
    const requestedGroupId = (formData.get('groupId') as string)?.trim() || null
    if (formData.has('groupId')) {
      if (requestedGroupId) {
        const photoCategory = category || (await prisma.photo.findUnique({ where: { id }, select: { category: true } }))?.category
        const group = await prisma.photoGroup.findFirst({ where: { id: requestedGroupId, category: photoCategory } })
        if (!group) {
          return NextResponse.json({ success: false, error: '所选作品组与照片分类不一致' }, { status: 400 })
        }
        data.groupId = group.id
      } else {
        data.groupId = null
      }
    } else if (category) {
      const current = await prisma.photo.findUnique({ where: { id }, select: { group: { select: { category: true } } } })
      if (current?.group && current.group.category !== category) data.groupId = null
    }
    const focalLength = (formData.get('focalLength') as string)?.trim()
    if (focalLength !== undefined) data.focalLength = focalLength || null
    const aperture = (formData.get('aperture') as string)?.trim()
    if (aperture !== undefined) data.aperture = aperture || null
    const iso = (formData.get('iso') as string)?.trim()
    if (iso !== undefined) data.iso = iso || null
    const shutterSpeed = (formData.get('shutterSpeed') as string)?.trim()
    if (shutterSpeed !== undefined) data.shutterSpeed = shutterSpeed || null
    const camera = (formData.get('camera') as string)?.trim()
    if (camera !== undefined) data.camera = camera || null
    const lens = (formData.get('lens') as string)?.trim()
    if (lens !== undefined) data.lens = lens || null
    const tags = formData.get('tags')
    if (tags) data.tags = parseTags(tags as string)
    const featured = formData.get('featured')
    if (featured !== null) data.featured = featured === 'true'
    const sortOrder = formData.get('sortOrder')
    if (sortOrder !== null) data.sortOrder = parseInt(sortOrder as string) || 0
    const published = formData.get('published')
    if (published !== null) data.published = published !== 'false'

    const photo = await prisma.photo.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      success: true,
      data: { ...photo, createdAt: photo.createdAt.toISOString(), updatedAt: photo.updatedAt.toISOString() },
    })
  } catch (error) {
    console.error('PUT /api/admin/photos/[id] error:', error)
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
    const photo = await prisma.photo.findUnique({ where: { id } })
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // Delete associated image files
    const publicDir = path.join(process.cwd(), 'public')
    const filesToDelete = [photo.imageUrl, photo.thumbnailUrl, photo.originalUrl].filter(Boolean) as string[]
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(path.join(publicDir, filePath))
      } catch {
        // File may not exist
      }
    }

    await prisma.$transaction([
      prisma.photoGroup.updateMany({ where: { coverPhotoId: id }, data: { coverPhotoId: null } }),
      prisma.photo.delete({ where: { id } }),
    ])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/photos/[id] error:', error)
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }
}

function parseTags(value: string): string[] {
  try {
    return JSON.parse(value)
  } catch {
    return value.split(',').map((t) => t.trim()).filter(Boolean)
  }
}
