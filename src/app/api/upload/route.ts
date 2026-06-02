import { NextRequest, NextResponse } from 'next/server'
import { saveUploadedFile } from '@/lib/image'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`upload:${ip}`, { interval: 60_000, maxRequests: 10 })
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Too many uploads' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0 || files.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Upload 1-5 files' },
        { status: 400 }
      )
    }

    const results = await Promise.allSettled(
      files.map((file) => {
        if (!file.type.startsWith('image/')) {
          return Promise.reject(new Error(`Not an image: ${file.name}`))
        }
        if (file.size > 20 * 1024 * 1024) {
          return Promise.reject(new Error(`File too large: ${file.name}`))
        }
        return saveUploadedFile(file)
      })
    )

    const uploaded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<{ url: string; thumbUrl: string; width: number; height: number }>).value)

    return NextResponse.json({ success: true, data: uploaded })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
