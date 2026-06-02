import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { containsSensitiveContent } from '@/lib/sensitive-words'
import { saveUploadedFile } from '@/lib/image'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'approved'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit
    const type = searchParams.get('type')
    const photoId = searchParams.get('photoId')

    const where: Prisma.MessageWhereInput = { status: status as string }
    if (type) where.type = type
    if (photoId) where.photoId = photoId

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          replies: {
            where: { status: 'approved' },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.message.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
        replies: m.replies?.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`message:${ip}`, { interval: 60_000, maxRequests: 5 })
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please wait before posting again.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const nickname = (formData.get('nickname') as string)?.trim() || 'Anonymous'
    const content = (formData.get('content') as string)?.trim()
    const messageType = (formData.get('type') as string) || 'comment'
    const photoId = (formData.get('photoId') as string) || null
    const imageFiles = formData.getAll('images') as File[]

    if (!content || content.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Sensitive content check
    if (containsSensitiveContent(content) || containsSensitiveContent(nickname)) {
      return NextResponse.json(
        { success: false, error: 'Message contains prohibited content' },
        { status: 400 }
      )
    }

    // Process uploaded images
    const imageUrls: string[] = []
    if (imageFiles.length > 0) {
      const validImageFiles = imageFiles.slice(0, 3)
      for (const file of validImageFiles) {
        if (file.size > 10 * 1024 * 1024) continue
        if (!file.type.startsWith('image/')) continue
        try {
          const result = await saveUploadedFile(file)
          imageUrls.push(result.url)
        } catch (err) {
          console.error('Image upload error:', err)
        }
      }
    }

    const message = await prisma.message.create({
      data: {
        nickname,
        content,
        type: imageUrls.length > 0 ? 'photo_share' : messageType,
        images: imageUrls,
        photoId: photoId || undefined,
        status: 'pending',
        ip,
        userAgent: request.headers.get('user-agent') || '',
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...message,
          createdAt: message.createdAt.toISOString(),
        },
        message: 'Message submitted. It will appear after review.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
