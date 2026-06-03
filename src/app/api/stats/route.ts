import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS site_stats (key TEXT PRIMARY KEY, value INTEGER DEFAULT 0)`
    )
    await prisma.$executeRawUnsafe(
      `INSERT INTO site_stats (key, value) VALUES ('visits', 1) ON CONFLICT (key) DO UPDATE SET value = site_stats.value + 1`
    )
    const rows = await prisma.$queryRawUnsafe<{ key: string; value: number }[]>(
      `SELECT key, value FROM site_stats WHERE key = 'visits'`
    )
    const count = rows[0]?.value || 0
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
