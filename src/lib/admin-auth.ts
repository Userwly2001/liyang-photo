import { jwtVerify } from 'jose'
import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'

const FALLBACK_SECRET = 'fallback-secret'

export function getJwtSecret() {
  return process.env.JWT_SECRET || FALLBACK_SECRET
}

export function hashAdminPassword(password: string) {
  return createHash('sha256').update(password + getJwtSecret()).digest('hex')
}

export async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  try {
    const secret = new TextEncoder().encode(getJwtSecret())
    const { payload } = await jwtVerify(authHeader.slice(7), secret)
    return (payload as { role?: string }).role === 'admin'
  } catch {
    return false
  }
}
