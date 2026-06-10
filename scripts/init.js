const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');

const prisma = new PrismaClient();

async function waitForDB(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$executeRawUnsafe('SELECT 1');
      return;
    } catch {
      console.log(`等待数据库... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('数据库连接超时');
}

async function init() {
  await waitForDB();
  console.log('数据库已连接');

  // 建表
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL, sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY DEFAULT 'default', name TEXT DEFAULT 'Leon Wang',
      title TEXT DEFAULT '摄影师', bio TEXT DEFAULT '', avatar TEXT DEFAULT '',
      hero_image TEXT DEFAULT '',
      email TEXT DEFAULT '', instagram TEXT DEFAULT '', wechat TEXT DEFAULT '',
      location TEXT DEFAULT '', updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE profile ADD COLUMN IF NOT EXISTS hero_image TEXT DEFAULT ''
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      category TEXT NOT NULL, image_url TEXT NOT NULL, thumbnail_url TEXT,
      original_url TEXT, blur_hash TEXT, width INTEGER, height INTEGER,
      focal_length TEXT, aperture TEXT, iso TEXT, shutter_speed TEXT,
      camera TEXT, lens TEXT, tags TEXT[] DEFAULT '{}',
      featured BOOLEAN DEFAULT false, sort_order INTEGER DEFAULT 0,
      published BOOLEAN DEFAULT true, like_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE photos ADD COLUMN IF NOT EXISTS original_url TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE photos ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS photo_groups (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      category TEXT NOT NULL, cover_photo_id TEXT, location TEXT,
      shot_at TIMESTAMP, sort_order INTEGER DEFAULT 0,
      published BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE photos ADD COLUMN IF NOT EXISTS group_id TEXT
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS photos_group_id_idx ON photos(group_id)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS photo_groups_category_idx ON photo_groups(category)
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS photo_likes (
      photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
      visitor_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (photo_id, visitor_hash)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL, excerpt TEXT, cover_image TEXT,
      tags TEXT[] DEFAULT '{}', published BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, nickname TEXT DEFAULT 'Anonymous',
      content TEXT NOT NULL, images TEXT[] DEFAULT '{}',
      type TEXT DEFAULT 'comment', photo_id TEXT,
      parent_id TEXT, status TEXT DEFAULT 'pending',
      ip TEXT, user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_stats (
      date DATE PRIMARY KEY,
      count INTEGER DEFAULT 0
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_visitors (
      date DATE NOT NULL,
      visitor_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (date, visitor_hash)
    )
  `);
  console.log('数据表已就绪');

  // 管理员
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'changeme123';
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
  const hash = createHash('sha256').update(password + jwtSecret).digest('hex');

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash: hash },
    create: { id: 'a1', username, passwordHash: hash },
  });
  console.log('管理员已创建');

  // 分类
  for (const cat of [
    { id: 'cat1', slug: 'portrait', label: '人像', sortOrder: 0 },
    { id: 'cat2', slug: 'landscape', label: '风光', sortOrder: 1 },
    { id: 'cat3', slug: 'food', label: '美食', sortOrder: 2 },
  ]) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
  }
  console.log('分类已初始化');

  // 个人资料
  await prisma.profile.upsert({
    where: { id: 'default' },
    update: { email: 'liyang.wang.max@icloud.com' },
    create: { id: 'default', name: 'Leon Wang', title: '摄影师', email: 'liyang.wang.max@icloud.com' },
  });
  console.log('个人资料已初始化');

  await prisma.$disconnect();
  console.log('初始化完成');
}

init().catch((e) => {
  console.error('初始化失败:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
