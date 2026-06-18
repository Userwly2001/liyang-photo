import { createHash } from 'crypto'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export type SiteSection =
  | 'home'
  | 'gallery'
  | 'blog'
  | 'ielts_vocab'
  | 'ielts_listening'
  | 'other'

let statsTablesPromise: Promise<void> | null = null

export async function ensureStatsTables() {
  if (!statsTablesPromise) {
    statsTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_stats (
          date DATE PRIMARY KEY,
          count INTEGER DEFAULT 0,
          page_views INTEGER DEFAULT 0
        )
      `)
      await prisma.$executeRawUnsafe(`
        ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_visitors (
          date DATE NOT NULL,
          visitor_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (date, visitor_hash)
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_page_stats (
          date DATE NOT NULL,
          section TEXT NOT NULL,
          page_views INTEGER DEFAULT 0,
          unique_visitors INTEGER DEFAULT 0,
          PRIMARY KEY (date, section)
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_page_visitors (
          date DATE NOT NULL,
          section TEXT NOT NULL,
          visitor_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (date, section, visitor_hash)
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_event_stats (
          date DATE NOT NULL,
          event TEXT NOT NULL,
          count INTEGER DEFAULT 0,
          PRIMARY KEY (date, event)
        )
      `)
    })().catch((error) => {
      statsTablesPromise = null
      throw error
    })
  }
  await statsTablesPromise
}

export function getShanghaiDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function classifyPath(pathname: string): SiteSection {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/gallery') || pathname.startsWith('/portrait') || pathname.startsWith('/landscape') || pathname.startsWith('/food')) return 'gallery'
  if (pathname.startsWith('/blog')) return 'blog'
  if (pathname.startsWith('/ielts-vocab')) return 'ielts_vocab'
  if (pathname.startsWith('/ielts-listening')) return 'ielts_listening'
  return 'other'
}

function getVisitorHash(request: NextRequest, date: string) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return createHash('sha256').update(`${date}:${ip}:${userAgent}`).digest('hex')
}

export async function recordSiteVisit(request: NextRequest, pathname: string) {
  await ensureStatsTables()

  const date = getShanghaiDate()
  const section = classifyPath(pathname)
  const visitorHash = getVisitorHash(request, date)

  const siteInserted = await prisma.$executeRawUnsafe(
    `INSERT INTO site_visitors (date, visitor_hash)
     VALUES ($1::date, $2)
     ON CONFLICT DO NOTHING`,
    date,
    visitorHash
  )
  const sectionInserted = await prisma.$executeRawUnsafe(
    `INSERT INTO site_page_visitors (date, section, visitor_hash)
     VALUES ($1::date, $2, $3)
     ON CONFLICT DO NOTHING`,
    date,
    section,
    visitorHash
  )

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `INSERT INTO site_stats (date, count, page_views)
       VALUES ($1::date, $2, 1)
       ON CONFLICT (date) DO UPDATE SET
         count = site_stats.count + EXCLUDED.count,
         page_views = site_stats.page_views + 1`,
      date,
      siteInserted > 0 ? 1 : 0
    ),
    prisma.$executeRawUnsafe(
      `INSERT INTO site_page_stats (date, section, page_views, unique_visitors)
       VALUES ($1::date, $2, 1, $3)
       ON CONFLICT (date, section) DO UPDATE SET
         page_views = site_page_stats.page_views + 1,
         unique_visitors = site_page_stats.unique_visitors + EXCLUDED.unique_visitors`,
      date,
      section,
      sectionInserted > 0 ? 1 : 0
    ),
  ])

  return { counted: siteInserted > 0, section }
}

export async function recordSiteEvent(event: 'listening_signed' | 'listening_rate_limited') {
  await ensureStatsTables()
  const date = getShanghaiDate()
  await prisma.$executeRawUnsafe(
    `INSERT INTO site_event_stats (date, event, count)
     VALUES ($1::date, $2, 1)
     ON CONFLICT (date, event) DO UPDATE SET count = site_event_stats.count + 1`,
    date,
    event
  )
}
