import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'changeme123'
  const hash = createHash('sha256').update(password + (process.env.JWT_SECRET || 'fallback-secret')).digest('hex')

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash: hash },
    create: { username, passwordHash: hash },
  })
  console.log(`✓ Admin user "${username}" created`)

  // Read blog posts from content directory
  const contentDir = path.join(process.cwd(), 'content', 'blog')
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const content = fs.readFileSync(path.join(contentDir, file), 'utf-8')
      const slug = file.replace('.md', '')
      const title = content.split('\n')[0].replace(/^#\s*/, '').trim()

      await prisma.blogPost.upsert({
        where: { slug },
        update: { content, title, published: true },
        create: {
          title,
          slug,
          content,
          excerpt: content.split('\n').slice(2, 4).join(' ').replace(/[#*`]/g, '').slice(0, 200),
          published: true,
          tags: ['photography'],
        },
      })
      console.log(`✓ Blog post "${slug}" created`)
    }
  }

  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
