import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureStatsTables() {
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_stats (
        date DATE PRIMARY KEY,
        count INTEGER DEFAULT 0
      )
    `)
  await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_visitors (
        date DATE NOT NULL,
        visitor_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (date, visitor_hash)
      )
    `)
}

function getShanghaiDate() {
  const date = new Date()
  date.setHours(date.getHours() + 8)
  return date.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  try {
    await ensureStatsTables()

    const today = getShanghaiDate()
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const visitorHash = createHash('sha256')
      .update(`${today}:${ip}:${userAgent}`)
      .digest('hex')

    const inserted = await prisma.$executeRawUnsafe(
      `INSERT INTO site_visitors (date, visitor_hash)
       VALUES ($1::date, $2)
       ON CONFLICT DO NOTHING`,
      today,
      visitorHash
    )

    if (inserted > 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO site_stats (date, count)
         VALUES ($1::date, 1)
         ON CONFLICT (date) DO UPDATE SET count = site_stats.count + 1`,
        today
      )
    }

    return NextResponse.json({ success: true, counted: inserted > 0 })
  } catch (error) {
    console.error('POST /api/stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to record visit' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureStatsTables()

    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    const rows = await prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
      `SELECT date::text, count FROM site_stats WHERE date >= $1::date ORDER BY date`,
      startDate.toISOString().slice(0, 10)
    )

    // Total visits
    const totalRow = await prisma.$queryRawUnsafe<{ total: string }[]>(
      `SELECT SUM(count)::text as total FROM site_stats`
    )
    const total = parseInt(totalRow[0]?.total || '0')

    const stats: Record<string, number> = {}
    for (const row of rows) stats[row.date] = row.count

    return NextResponse.json({ daily: stats, total })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ daily: {}, total: 0 })
  }
}
