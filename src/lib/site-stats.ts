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

type VisitMetadata = {
  referrer?: string
  search?: string
  language?: string
  screenWidth?: number
}

type VisitDimension =
  | 'path'
  | 'source'
  | 'device'
  | 'browser'
  | 'os'
  | 'country'
  | 'language'
  | 'hour'

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
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_dimension_stats (
          date DATE NOT NULL,
          dimension TEXT NOT NULL,
          value TEXT NOT NULL,
          page_views INTEGER DEFAULT 0,
          unique_visitors INTEGER DEFAULT 0,
          PRIMARY KEY (date, dimension, value)
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS site_dimension_visitors (
          date DATE NOT NULL,
          dimension TEXT NOT NULL,
          value TEXT NOT NULL,
          visitor_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (date, dimension, value, visitor_hash)
        )
      `)
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS site_dimension_stats_lookup
        ON site_dimension_stats (dimension, date)
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

function normalizePath(pathname: string) {
  if (!pathname.startsWith('/')) return '/'
  const clean = pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  return clean.slice(0, 240)
}

function getDevice(screenWidth: number | undefined, userAgent: string) {
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return 'tablet'
  if (/mobi|android|iphone|ipod/i.test(userAgent)) return 'mobile'
  if (screenWidth && screenWidth < 768) return 'mobile'
  return 'desktop'
}

function getBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) return 'Edge'
  if (/opr\/|opera/i.test(userAgent)) return 'Opera'
  if (/firefox\//i.test(userAgent)) return 'Firefox'
  if (/chrome\//i.test(userAgent)) return 'Chrome'
  if (/safari\//i.test(userAgent)) return 'Safari'
  return '其他'
}

function getOperatingSystem(userAgent: string) {
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS'
  if (/android/i.test(userAgent)) return 'Android'
  if (/windows/i.test(userAgent)) return 'Windows'
  if (/mac os|macintosh/i.test(userAgent)) return 'macOS'
  if (/linux/i.test(userAgent)) return 'Linux'
  return '其他'
}

function normalizeCountry(request: NextRequest) {
  const country =
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country-code')
  return country && /^[A-Z]{2}$/i.test(country) ? country.toUpperCase() : '未知'
}

function normalizeLanguage(language: string | undefined, request: NextRequest) {
  const raw = language || request.headers.get('accept-language')?.split(',')[0] || ''
  const code = raw.trim().split('-')[0].toLowerCase()
  return /^[a-z]{2,3}$/.test(code) ? code : '未知'
}

function normalizeSource(metadata: VisitMetadata, request: NextRequest) {
  const search = new URLSearchParams(metadata.search?.slice(0, 500) || '')
  const campaignSource = search.get('utm_source')
  if (campaignSource) {
    return `utm:${campaignSource.replace(/[^\p{L}\p{N}._-]/gu, '').slice(0, 60) || 'unknown'}`
  }

  if (!metadata.referrer) return '直接访问'
  try {
    const referrer = new URL(metadata.referrer)
    const currentHost = request.nextUrl.hostname.replace(/^www\./, '')
    const referrerHost = referrer.hostname.replace(/^www\./, '')
    if (!referrerHost || referrerHost === currentHost) return '站内跳转'
    return referrerHost.slice(0, 120)
  } catch {
    return '直接访问'
  }
}

function getShanghaiHour() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(new Date()).padStart(2, '0')
}

function isBot(userAgent: string) {
  return /bot|crawler|spider|slurp|headless|lighthouse|monitor|preview|facebookexternalhit|bytespider/i.test(userAgent)
}

export async function recordSiteVisit(
  request: NextRequest,
  pathname: string,
  metadata: VisitMetadata = {}
) {
  await ensureStatsTables()

  const date = getShanghaiDate()
  const normalizedPath = normalizePath(pathname)
  const section = classifyPath(normalizedPath)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  if (normalizedPath.startsWith('/admin') || normalizedPath.startsWith('/api') || isBot(userAgent)) {
    return { counted: false, section, ignored: true }
  }

  const visitorHash = getVisitorHash(request, date)
  const dimensions: [VisitDimension, string][] = [
    ['path', normalizedPath],
    ['source', normalizeSource(metadata, request)],
    ['device', getDevice(metadata.screenWidth, userAgent)],
    ['browser', getBrowser(userAgent)],
    ['os', getOperatingSystem(userAgent)],
    ['country', normalizeCountry(request)],
    ['language', normalizeLanguage(metadata.language, request)],
    ['hour', getShanghaiHour()],
  ]

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
    ...dimensions.map(([dimension, value]) =>
      prisma.$executeRawUnsafe(
        `WITH inserted AS (
           INSERT INTO site_dimension_visitors (date, dimension, value, visitor_hash)
           VALUES ($1::date, $2, $3, $4)
           ON CONFLICT DO NOTHING
           RETURNING 1
         )
         INSERT INTO site_dimension_stats (date, dimension, value, page_views, unique_visitors)
         VALUES ($1::date, $2, $3, 1, (SELECT COUNT(*)::int FROM inserted))
         ON CONFLICT (date, dimension, value) DO UPDATE SET
           page_views = site_dimension_stats.page_views + 1,
           unique_visitors = site_dimension_stats.unique_visitors + EXCLUDED.unique_visitors`,
        date,
        dimension,
        value,
        visitorHash
      )
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
