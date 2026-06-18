import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { ensureStatsTables, getShanghaiDate } from '@/lib/site-stats'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureStatsTables()
    const today = getShanghaiDate()

    const [summaryRows, daily, sections, events] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          total_uv: string | null
          total_pv: string | null
          today_uv: number | null
          today_pv: number | null
          seven_day_uv: string | null
          seven_day_pv: string | null
        }[]
      >(
        `SELECT
           SUM(count)::text AS total_uv,
           SUM(page_views)::text AS total_pv,
           MAX(CASE WHEN date = $1::date THEN count ELSE 0 END) AS today_uv,
           MAX(CASE WHEN date = $1::date THEN page_views ELSE 0 END) AS today_pv,
           SUM(CASE WHEN date >= $1::date - INTERVAL '6 days' THEN count ELSE 0 END)::text AS seven_day_uv,
           SUM(CASE WHEN date >= $1::date - INTERVAL '6 days' THEN page_views ELSE 0 END)::text AS seven_day_pv
         FROM site_stats`,
        today
      ),
      prisma.$queryRawUnsafe<{ date: string; uv: number; pv: number }[]>(
        `SELECT date::text, count AS uv, page_views AS pv
         FROM site_stats
         WHERE date >= $1::date - INTERVAL '13 days'
         ORDER BY date`,
        today
      ),
      prisma.$queryRawUnsafe<{ section: string; uv: string; pv: string }[]>(
        `SELECT section, SUM(unique_visitors)::text AS uv, SUM(page_views)::text AS pv
         FROM site_page_stats
         WHERE date >= $1::date - INTERVAL '29 days'
         GROUP BY section
         ORDER BY SUM(page_views) DESC`,
        today
      ),
      prisma.$queryRawUnsafe<{ event: string; today: number; seven_days: string }[]>(
        `SELECT
           event,
           MAX(CASE WHEN date = $1::date THEN count ELSE 0 END) AS today,
           SUM(CASE WHEN date >= $1::date - INTERVAL '6 days' THEN count ELSE 0 END)::text AS seven_days
         FROM site_event_stats
         GROUP BY event`,
        today
      ),
    ])

    const summary = summaryRows[0]
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUv: Number(summary?.total_uv || 0),
          totalPv: Number(summary?.total_pv || 0),
          todayUv: Number(summary?.today_uv || 0),
          todayPv: Number(summary?.today_pv || 0),
          sevenDayUv: Number(summary?.seven_day_uv || 0),
          sevenDayPv: Number(summary?.seven_day_pv || 0),
        },
        daily,
        sections: sections.map((row) => ({
          section: row.section,
          uv: Number(row.uv),
          pv: Number(row.pv),
        })),
        events: events.map((row) => ({
          event: row.event,
          today: Number(row.today),
          sevenDays: Number(row.seven_days),
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/admin/stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load stats' },
      { status: 500 }
    )
  }
}
