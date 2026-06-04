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
    let profile = await prisma.profile.findUnique({ where: { id: 'default' } })
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: 'default',
          name: 'Leon Wang',
          title: '摄影师',
          email: 'liyang.wang.max@icloud.com',
        },
      })
    }
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('GET /api/admin/profile error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const isAdmin = await verifyAdmin(request)
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.name !== undefined) data.name = body.name
    if (body.title !== undefined) data.title = body.title
    if (body.bio !== undefined) data.bio = body.bio
    if (body.avatar !== undefined) data.avatar = body.avatar
    if (body.heroImage !== undefined) data.heroImage = body.heroImage
    if (body.email !== undefined) data.email = body.email
    if (body.instagram !== undefined) data.instagram = body.instagram
    if (body.wechat !== undefined) data.wechat = body.wechat
    if (body.location !== undefined) data.location = body.location

    const profile = await prisma.profile.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error('PUT /api/admin/profile error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
