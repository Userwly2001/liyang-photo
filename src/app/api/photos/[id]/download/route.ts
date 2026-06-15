import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

const UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads')

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

function downloadName(title: string, extension: string) {
  const cleanTitle = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() || 'Leon-Wang-photo'
  return `${cleanTitle}${extension}`
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const photo = await prisma.photo.findFirst({
    where: { id, published: true },
    select: { title: true, imageUrl: true, originalUrl: true },
  })

  if (!photo) {
    return Response.json({ success: false, error: 'Photo not found' }, { status: 404 })
  }

  const sourceUrl = photo.originalUrl || photo.imageUrl
  if (!sourceUrl.startsWith('/uploads/')) {
    return Response.json({ success: false, error: 'Photo file unavailable' }, { status: 404 })
  }

  const relativePath = sourceUrl.slice('/uploads/'.length)
  const filePath = path.resolve(UPLOAD_ROOT, relativePath)
  if (!filePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    return Response.json({ success: false, error: 'Invalid photo path' }, { status: 400 })
  }

  try {
    const file = await fs.readFile(filePath)
    const extension = path.extname(filePath).toLowerCase()
    const filename = downloadName(photo.title, extension)

    return new Response(new Uint8Array(file), {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="Leon-Wang-photo${extension}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(file.byteLength),
        'Content-Type': CONTENT_TYPES[extension] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return Response.json({ success: false, error: 'Photo file unavailable' }, { status: 404 })
  }
}
