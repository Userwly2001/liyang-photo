import { createHash, randomUUID } from 'crypto'
import COS from 'cos-nodejs-sdk-v5'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CLIENT_COOKIE = 'ielts_listening_client'
const SIGNED_URL_EXPIRES_SECONDS = 600

function getRequiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
  return NextResponse.json(
    { success: false, error: '音频请求过于频繁，请稍后重试' },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': String(retryAfter),
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const book = Number(request.nextUrl.searchParams.get('book'))
  const test = Number(request.nextUrl.searchParams.get('test'))
  const section = Number(request.nextUrl.searchParams.get('section'))

  if (
    !Number.isInteger(book) ||
    book < 10 ||
    book > 20 ||
    !Number.isInteger(test) ||
    test < 1 ||
    test > 4 ||
    !Number.isInteger(section) ||
    section < 1 ||
    section > 4
  ) {
    return NextResponse.json(
      { success: false, error: '无效的听力文件参数' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const clientId = request.cookies.get(CLIENT_COOKIE)?.value || randomUUID()
  const clientHash = createHash('sha256').update(clientId).digest('hex')
  const ipHash = createHash('sha256').update(getClientIp(request)).digest('hex')

  const clientLimit = rateLimit(`listening-audio:client:${clientHash}`, {
    interval: 60_000,
    maxRequests: 10,
  })
  if (!clientLimit.allowed) return rateLimitResponse(clientLimit.resetAt)

  const ipLimit = rateLimit(`listening-audio:ip:${ipHash}`, {
    interval: 60_000,
    maxRequests: 30,
  })
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.resetAt)

  try {
    const cos = new COS({
      SecretId: getRequiredEnv('TENCENT_COS_SECRET_ID'),
      SecretKey: getRequiredEnv('TENCENT_COS_SECRET_KEY'),
    })
    const extension = book === 20 ? 'MP3' : 'mp3'
    const key = `audio/C${book}-T${test}-S${section}.${extension}`
    const url = cos.getObjectUrl({
      Bucket: getRequiredEnv('TENCENT_COS_BUCKET'),
      Region: getRequiredEnv('TENCENT_COS_REGION'),
      Key: key,
      Sign: true,
      Method: 'GET',
      Expires: SIGNED_URL_EXPIRES_SECONDS,
      Protocol: 'https:',
    })

    const response = NextResponse.json(
      {
        success: true,
        data: {
          url,
          expiresIn: SIGNED_URL_EXPIRES_SECONDS,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
          'X-RateLimit-Remaining': String(
            Math.min(clientLimit.remaining, ipLimit.remaining)
          ),
        },
      }
    )

    if (!request.cookies.get(CLIENT_COOKIE)) {
      response.cookies.set(CLIENT_COOKIE, clientId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  } catch (error) {
    console.error('Failed to create COS signed URL:', error)
    return NextResponse.json(
      { success: false, error: '音频授权暂时不可用' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
