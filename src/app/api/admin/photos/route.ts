import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveUploadedFile } from '@/lib/image'

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
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (category) where.category = category

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: photos.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/photos error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = [
      ...formData.getAll('files'),
      ...formData.getAll('file'),
    ].filter((item): item is File => item instanceof File && item.size > 0)

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Image file is required' }, { status: 400 })
    }

    if (files.length > 30) {
      return NextResponse.json({ success: false, error: 'Upload up to 30 files at once' }, { status: 400 })
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'))
    if (invalidFile) {
      return NextResponse.json({ success: false, error: `File must be an image: ${invalidFile.name}` }, { status: 400 })
    }

    const oversizedFile = files.find((file) => file.size > 20 * 1024 * 1024)
    if (oversizedFile) {
      return NextResponse.json({ success: false, error: `File too large (max 20MB): ${oversizedFile.name}` }, { status: 400 })
    }

    const title = (formData.get('title') as string)?.trim()
    const category = (formData.get('category') as string)?.trim()
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 })
    }

    if (files.length === 1 && !title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const baseSortOrder = parseInt(formData.get('sortOrder') as string) || 0
    const preserveOriginal = formData.get('preserveOriginal') !== 'false'
    const created = []

    const createPhoto = async (file: File, index: number) => {
      const img = await saveUploadedFile(file, { preserveOriginal })
      const fallbackTitle = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || `照片 ${index + 1}`

      return prisma.photo.create({
        data: {
          title: files.length === 1 ? (title || fallbackTitle) : fallbackTitle,
          description: (formData.get('description') as string)?.trim() || null,
          category,
          imageUrl: img.url,
          thumbnailUrl: img.thumbUrl,
          originalUrl: img.originalUrl || null,
          width: img.width,
          height: img.height,
          focalLength: (formData.get('focalLength') as string)?.trim() || null,
          aperture: (formData.get('aperture') as string)?.trim() || null,
          iso: (formData.get('iso') as string)?.trim() || null,
          shutterSpeed: (formData.get('shutterSpeed') as string)?.trim() || null,
          camera: (formData.get('camera') as string)?.trim() || null,
          lens: (formData.get('lens') as string)?.trim() || null,
          tags: parseTags(formData.get('tags') as string),
          featured: formData.get('featured') === 'true',
          sortOrder: baseSortOrder + index,
          published: formData.get('published') !== 'false',
        },
      })
    }

    for (let start = 0; start < files.length; start += 3) {
      const batch = files.slice(start, start + 3)
      const batchPhotos = await Promise.all(
        batch.map((file, offset) => createPhoto(file, start + offset))
      )
      created.push(...batchPhotos)
    }

    return NextResponse.json({
      success: true,
      data: created.map((photo) => ({
        ...photo,
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
      })),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/photos error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create photo' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const orderedIds: string[] = Array.isArray(body.orderedIds)
      ? body.orderedIds.filter((id: unknown): id is string => typeof id === 'string')
      : []

    if (orderedIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No photo order provided' }, { status: 400 })
    }

    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.photo.update({
        where: { id },
        data: { sortOrder: index },
      }))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/admin/photos error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 })
  }
}

function parseTags(value: string | null): string[] {
  if (!value) return []
  try {
    return JSON.parse(value)
  } catch {
    return value.split(',').map((t) => t.trim()).filter(Boolean)
  }
}
