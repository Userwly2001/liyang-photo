import { createHash, randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VISITOR_COOKIE = 'leonphoto_visitor'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value || randomUUID()
  const visitorHash = createHash('sha256').update(visitorId).digest('hex')

  try {
    const photo = await prisma.photo.findFirst({
      where: { id, published: true },
      select: { id: true },
    })
    if (!photo) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 })
    }

    const existing = await prisma.photoLike.findUnique({
      where: { photoId_visitorHash: { photoId: id, visitorHash } },
    })

    const result = await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.photoLike.delete({
          where: { photoId_visitorHash: { photoId: id, visitorHash } },
        })
        const updated = await tx.photo.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        })
        return { liked: false, likeCount: Math.max(updated.likeCount, 0) }
      }

      await tx.photoLike.create({ data: { photoId: id, visitorHash } })
      const updated = await tx.photo.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      })
      return { liked: true, likeCount: updated.likeCount }
    })

    const response = NextResponse.json({ success: true, data: result })
    if (!cookieStore.get(VISITOR_COOKIE)) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }
    return response
  } catch (error) {
    console.error('POST /api/photos/[id]/like error:', error)
    return NextResponse.json({ success: false, error: 'Unable to update like' }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value
  const visitorHash = visitorId
    ? createHash('sha256').update(visitorId).digest('hex')
    : null

  const [photo, like] = await Promise.all([
    prisma.photo.findFirst({
      where: { id, published: true },
      select: { likeCount: true },
    }),
    visitorHash
      ? prisma.photoLike.findUnique({
          where: { photoId_visitorHash: { photoId: id, visitorHash } },
          select: { photoId: true },
        })
      : null,
  ])

  if (!photo) {
    return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: { liked: Boolean(like), likeCount: photo.likeCount },
  })
}
