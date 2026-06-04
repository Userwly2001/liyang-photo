import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads')
const PREVIEW_WIDTH = 2560
const THUMB_WIDTH = 480
const PREVIEW_QUALITY = 86
const THUMB_QUALITY = 50

export async function compressImage(
  buffer: Buffer,
  filename: string,
  options: { preserveOriginal?: boolean } = {}
): Promise<{ url: string; thumbUrl: string; originalUrl?: string; width: number; height: number }> {
  const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  const dir = path.join(UPLOAD_ROOT, dateDir)
  await fs.mkdir(dir, { recursive: true })

  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'image'
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, '') || '.jpg'
  const safeName = `${safeBase}-${Date.now()}-${randomUUID().slice(0, 8)}`
  const webpName = `${safeName}.webp`
  const thumbName = `${safeName}-thumb.webp`
  const originalName = `${safeName}-original${safeExt}`

  // Auto-rotate based on EXIF orientation and get true dimensions
  const rotated = await sharp(buffer).rotate().toBuffer()
  const metadata = await sharp(rotated).metadata()
  const originalWidth = metadata.width || 1920
  const originalHeight = metadata.height || 1080

  const originalUrlPath = options.preserveOriginal
    ? `/uploads/${dateDir}/${originalName}`
    : undefined

  if (options.preserveOriginal) {
    await fs.writeFile(path.join(dir, originalName), buffer)
  }

  // Generate high quality preview image for the lightbox.
  const previewImage = await sharp(rotated)
    .resize({ width: Math.min(originalWidth, PREVIEW_WIDTH), withoutEnlargement: true })
    .webp({ quality: PREVIEW_QUALITY })
    .toBuffer()
  await fs.writeFile(path.join(dir, webpName), previewImage)

  // Generate thumbnail
  const thumbImage = await sharp(rotated)
    .resize(THUMB_WIDTH)
    .webp({ quality: THUMB_QUALITY })
    .toBuffer()
  await fs.writeFile(path.join(dir, thumbName), thumbImage)

  const urlPath = `/uploads/${dateDir}/${webpName}`
  const thumbUrlPath = `/uploads/${dateDir}/${thumbName}`

  return {
    url: urlPath,
    thumbUrl: thumbUrlPath,
    originalUrl: originalUrlPath,
    width: Math.min(originalWidth, PREVIEW_WIDTH),
    height: Math.round(
      Math.min(originalWidth, PREVIEW_WIDTH) * (originalHeight / originalWidth)
    ),
  }
}

export async function saveUploadedFile(
  file: File,
  options: { preserveOriginal?: boolean } = {}
): Promise<{ url: string; thumbUrl: string; originalUrl?: string; width: number; height: number }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return compressImage(buffer, file.name, options)
}
