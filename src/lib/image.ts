import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'public/uploads'
const MAX_WIDTH = 1600
const THUMB_WIDTH = 480
const COMPRESSION_QUALITY = 75

export async function compressImage(
  buffer: Buffer,
  filename: string
): Promise<{ url: string; thumbUrl: string; width: number; height: number }> {
  const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  const dir = path.join(process.cwd(), UPLOAD_DIR, dateDir)
  await fs.mkdir(dir, { recursive: true })

  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  const safeName = `${base}-${Date.now()}`
  const webpName = `${safeName}.webp`
  const thumbName = `${safeName}-thumb.webp`

  // Auto-rotate based on EXIF orientation and get true dimensions
  const rotated = await sharp(buffer).rotate().toBuffer()
  const metadata = await sharp(rotated).metadata()
  const originalWidth = metadata.width || 1920
  const originalHeight = metadata.height || 1080

  // Compress full-size image
  const fullImage = await sharp(rotated)
    .resize({ width: Math.min(originalWidth, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: COMPRESSION_QUALITY })
    .toBuffer()
  await fs.writeFile(path.join(dir, webpName), fullImage)

  // Generate thumbnail
  const thumbImage = await sharp(rotated)
    .resize(THUMB_WIDTH)
    .webp({ quality: 50 })
    .toBuffer()
  await fs.writeFile(path.join(dir, thumbName), thumbImage)

  const urlPath = `/uploads/${dateDir}/${webpName}`
  const thumbUrlPath = `/uploads/${dateDir}/${thumbName}`

  return {
    url: urlPath,
    thumbUrl: thumbUrlPath,
    width: Math.min(originalWidth, MAX_WIDTH),
    height: Math.round(
      Math.min(originalWidth, MAX_WIDTH) * (originalHeight / originalWidth)
    ),
  }
}

export async function saveUploadedFile(
  file: File
): Promise<{ url: string; thumbUrl: string; width: number; height: number }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return compressImage(buffer, file.name)
}
