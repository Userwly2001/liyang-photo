import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SignJWT } from 'jose'
import { getJwtSecret, hashAdminPassword } from '@/lib/admin-auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    const rl = rateLimit(`auth:${ip}:${username}`, { interval: 60_000, maxRequests: 5 })
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // In production, first run a seed script to create the admin user
    const admin = await prisma.admin.findUnique({ where: { username } })

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const hash = hashAdminPassword(password)
    if (admin.passwordHash !== hash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const secret = new TextEncoder().encode(getJwtSecret())
    const token = await new SignJWT({ role: 'admin', sub: admin.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    return NextResponse.json({
      success: true,
      data: { token, expiresIn: '24h' },
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
