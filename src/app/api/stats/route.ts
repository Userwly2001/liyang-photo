import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Ensure table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_stats (
        date DATE PRIMARY KEY,
        count INTEGER DEFAULT 0
      )
    `)

    // Increment today's count
    const today = new Date().toISOString().slice(0, 10)
    await prisma.$executeRawUnsafe(
      `INSERT INTO site_stats (date, count) VALUES ($1, 1) ON CONFLICT (date) DO UPDATE SET count = site_stats.count + 1`,
      today
    )

    // Get last 365 days
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    const rows = await prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
      `SELECT date::text, count FROM site_stats WHERE date >= $1 ORDER BY date`,
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
  } catch {
    return NextResponse.json({ daily: {}, total: 0 })
  }
}
