import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureStatsTables, getShanghaiDate, recordSiteVisit } from '@/lib/site-stats'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const pathname =
      typeof body.pathname === 'string' && body.pathname.startsWith('/')
        ? body.pathname.slice(0, 300)
        : '/'
    const result = await recordSiteVisit(request, pathname)
    return NextResponse.json(
      { success: true, ...result },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('POST /api/stats error:', error)
    return NextResponse.json({ success: false, error: 'Failed to record visit' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await ensureStatsTables()

    const today = getShanghaiDate()
    const [summary] = await prisma.$queryRawUnsafe<
      { total: string | null; today: number | null }[]
    >(
      `SELECT
         SUM(count)::text AS total,
         MAX(CASE WHEN date = $1::date THEN count ELSE 0 END) AS today
       FROM site_stats`,
      today
    )
    return NextResponse.json(
      {
        total: Number(summary?.total || 0),
        today: Number(summary?.today || 0),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json(
      { total: 0, today: 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
