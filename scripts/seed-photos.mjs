import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const prisma = new PrismaClient()

const UPLOAD_BASE = path.join(process.cwd(), 'public', 'uploads')
const MAX_WIDTH = 1920
const THUMB_WIDTH = 480

async function processImage(inputPath, category, index) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
  const dir = path.join(UPLOAD_BASE, dateStr)
  fs.mkdirSync(dir, { recursive: true })

  const metadata = await sharp(inputPath).metadata()
  const safeName = `${category}-${index}-${Date.now()}`
  const webpName = `${safeName}.webp`
  const thumbName = `${safeName}-thumb.webp`

  await sharp(inputPath)
    .resize({ width: Math.min(metadata.width || 1920, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(dir, webpName))

  await sharp(inputPath)
    .resize(THUMB_WIDTH)
    .webp({ quality: 60 })
    .toFile(path.join(dir, thumbName))

  return {
    url: `/uploads/${dateStr}/${webpName}`,
    thumbUrl: `/uploads/${dateStr}/${thumbName}`,
    width: Math.min(metadata.width || 1920, MAX_WIDTH),
    height: Math.round(Math.min(metadata.width || 1920, MAX_WIDTH) * (metadata.height || 1080) / (metadata.width || 1920)),
  }
}

const photos = [
  { title: '光影之间', description: '窗边的自然光人像，捕捉最真实的情绪', file: 'portrait-1.jpg', category: 'portrait', tags: ['自然光', '人像'], focalLength: '85mm', aperture: '1.4', iso: '200', shutterSpeed: '1/250' },
  { title: '城市的另一面', description: '街头摄影，记录城市中的孤独与浪漫', file: 'portrait-2.jpg', category: 'portrait', tags: ['街拍', '城市'], focalLength: '35mm', aperture: '2.8', iso: '800', shutterSpeed: '1/125' },
  { title: '静谧午后', description: '午后阳光透过树叶洒在脸上的温柔瞬间', file: 'portrait-3.jpg', category: 'portrait', tags: ['自然光', '暖调'], focalLength: '50mm', aperture: '1.8', iso: '400', shutterSpeed: '1/500' },
  { title: '山巅之上', description: '黎明时分，云海在脚下翻涌', file: 'landscape-1.jpg', category: 'landscape', tags: ['山川', '云海', '日出'], focalLength: '16mm', aperture: '11', iso: '100', shutterSpeed: '1/30' },
  { title: '海岸线', description: '漫长的海岸线与夕阳交融的那一刻', file: 'landscape-2.jpg', category: 'landscape', tags: ['大海', '日落'], focalLength: '24mm', aperture: '8', iso: '100', shutterSpeed: '1/60' },
  { title: '森林深处', description: '走进迷雾森林，感受大自然的神秘力量', file: 'landscape-3.jpg', category: 'landscape', tags: ['森林', '迷雾'], focalLength: '70mm', aperture: '4', iso: '400', shutterSpeed: '1/100' },
]

async function main() {
  console.log('正在导入照片...')

  for (let i = 0; i < photos.length; i++) {
    const p = photos[i]
    const inputPath = path.join('/tmp/photos', p.file)

    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠ 文件不存在: ${inputPath}，跳过`)
      continue
    }

    console.log(`处理中: ${p.title}...`)
    const img = await processImage(inputPath, p.category, i)

    await prisma.photo.create({
      data: {
        title: p.title,
        description: p.description,
        category: p.category,
        imageUrl: img.url,
        thumbnailUrl: img.thumbUrl,
        width: img.width,
        height: img.height,
        focalLength: p.focalLength,
        aperture: p.aperture,
        iso: p.iso,
        shutterSpeed: p.shutterSpeed,
        tags: p.tags,
        featured: i < 4,
        sortOrder: i,
        published: true,
      },
    })

    console.log(`✓ ${p.title} 已导入`)
  }

  // Blog post in Chinese
  const blogSlug = 'wo-de-she-ying-zhi-lu'
  const existing = await prisma.blogPost.findUnique({ where: { slug: blogSlug } })
  if (!existing) {
    await prisma.blogPost.create({
      data: {
        title: '我的摄影之路',
        slug: blogSlug,
        excerpt: '从第一台相机到现在的感悟，分享我对摄影的理解和热爱。',
        content: `# 我的摄影之路

摄影对我来说，不仅仅是按下快门。它是一种观察世界的方式，一种与光影对话的语言。

## 一切的开始

还记得第一次拿起相机时的那种兴奋感。透过取景器，世界变得不一样了——每一束光、每一个影子都有了意义。

> "相机是工具，但照片是镜子——它映照出摄影师的内心。"

## 人像摄影

拍摄人像时，我最关注的是**情绪**。技术参数可以学习，但捕捉真实的情感需要耐心和共情。

### 我喜欢使用的设备
- **相机**: 索尼 A7R V
- **人像镜头**: 85mm f/1.4 GM
- **风光镜头**: 16-35mm f/2.8 GM

## 风光摄影

风光摄影教会了我等待——等待合适的光线、合适的季节、合适的瞬间。

## 关于这个网站

这个网站是我的个人作品集，你可以在这里看到我的摄影作品，也可以给我留言分享你的照片。欢迎常来！

---

*2025年 于上海*`,
        tags: ['摄影', '感悟'],
        published: true,
      },
    })
    console.log('✓ 博客文章已创建')
  }

  console.log('\n✅ 所有照片和文章已导入完成！')
}

main()
  .catch((e) => {
    console.error('错误:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
