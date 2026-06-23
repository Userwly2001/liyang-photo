import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { ensureStatsTables, getShanghaiDate } from '@/lib/site-stats'

export const dynamic = 'force-dynamic'

type DimensionName = 'path' | 'source' | 'device' | 'browser' | 'os' | 'country' | 'language'

function getDateRange(endDate: string, days: number) {
  const end = new Date(`${endDate}T00:00:00Z`)
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end)
    date.setUTCDate(end.getUTCDate() - (days - index - 1))
    return date.toISOString().slice(0, 10)
  })
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ensureStatsTables()
    const today = getShanghaiDate()

    const [summaryRows, dailyRows, sections, events, dimensionRows, hourlyRows] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          total_uv: string | null
          total_pv: string | null
          today_uv: number | null
          today_pv: number | null
          yesterday_uv: number | null
          yesterday_pv: number | null
          seven_day_uv: string | null
          seven_day_pv: string | null
          previous_seven_day_uv: string | null
          previous_seven_day_pv: string | null
        }[]
      >(
        `SELECT
           SUM(count)::text AS total_uv,
           SUM(page_views)::text AS total_pv,
           MAX(CASE WHEN date = $1::date THEN count ELSE 0 END) AS today_uv,
           MAX(CASE WHEN date = $1::date THEN page_views ELSE 0 END) AS today_pv,
           MAX(CASE WHEN date = $1::date - INTERVAL '1 day' THEN count ELSE 0 END) AS yesterday_uv,
           MAX(CASE WHEN date = $1::date - INTERVAL '1 day' THEN page_views ELSE 0 END) AS yesterday_pv,
           SUM(CASE WHEN date >= $1::date - INTERVAL '6 days' THEN count ELSE 0 END)::text AS seven_day_uv,
           SUM(CASE WHEN date >= $1::date - INTERVAL '6 days' THEN page_views ELSE 0 END)::text AS seven_day_pv,
           SUM(CASE WHEN date BETWEEN $1::date - INTERVAL '13 days' AND $1::date - INTERVAL '7 days' THEN count ELSE 0 END)::text AS previous_seven_day_uv,
           SUM(CASE WHEN date BETWEEN $1::date - INTERVAL '13 days' AND $1::date - INTERVAL '7 days' THEN page_views ELSE 0 END)::text AS previous_seven_day_pv
         FROM site_stats`,
        today
      ),
      prisma.$queryRawUnsafe<{ date: string; uv: number; pv: number }[]>(
        `SELECT date::text, count AS uv, page_views AS pv
         FROM site_stats
         WHERE date >= $1::date - INTERVAL '29 days'
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
      prisma.$queryRawUnsafe<
        { dimension: DimensionName; value: string; uv: string; pv: string }[]
      >(
        `WITH ranked AS (
           SELECT
             dimension,
             value,
             SUM(unique_visitors)::text AS uv,
             SUM(page_views)::text AS pv,
             ROW_NUMBER() OVER (
               PARTITION BY dimension
               ORDER BY SUM(page_views) DESC
             ) AS position
           FROM site_dimension_stats
           WHERE date >= $1::date - INTERVAL '29 days'
             AND dimension IN ('path', 'source', 'device', 'browser', 'os', 'country', 'language')
           GROUP BY dimension, value
         )
         SELECT dimension, value, uv, pv
         FROM ranked
         WHERE position <= 12
         ORDER BY dimension, position`,
        today
      ),
      prisma.$queryRawUnsafe<{ hour: string; uv: number; pv: number }[]>(
        `SELECT value AS hour, unique_visitors AS uv, page_views AS pv
         FROM site_dimension_stats
         WHERE date = $1::date AND dimension = 'hour'
         ORDER BY value`,
        today
      ),
    ])

    const summary = summaryRows[0]
    const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]))
    const daily = getDateRange(today, 30).map((date) => ({
      date,
      uv: Number(dailyByDate.get(date)?.uv || 0),
      pv: Number(dailyByDate.get(date)?.pv || 0),
    }))
    const hourlyByHour = new Map(hourlyRows.map((row) => [row.hour, row]))
    const hourly = Array.from({ length: 24 }, (_, hour) => {
      const key = String(hour).padStart(2, '0')
      return {
        hour: key,
        uv: Number(hourlyByHour.get(key)?.uv || 0),
        pv: Number(hourlyByHour.get(key)?.pv || 0),
      }
    })
    const dimensions = dimensionRows.reduce<Record<DimensionName, { value: string; uv: number; pv: number }[]>>(
      (result, row) => {
        result[row.dimension].push({
          value: row.value,
          uv: Number(row.uv),
          pv: Number(row.pv),
        })
        return result
      },
      {
        path: [],
        source: [],
        device: [],
        browser: [],
        os: [],
        country: [],
        language: [],
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUv: Number(summary?.total_uv || 0),
          totalPv: Number(summary?.total_pv || 0),
          todayUv: Number(summary?.today_uv || 0),
          todayPv: Number(summary?.today_pv || 0),
          yesterdayUv: Number(summary?.yesterday_uv || 0),
          yesterdayPv: Number(summary?.yesterday_pv || 0),
          sevenDayUv: Number(summary?.seven_day_uv || 0),
          sevenDayPv: Number(summary?.seven_day_pv || 0),
          previousSevenDayUv: Number(summary?.previous_seven_day_uv || 0),
          previousSevenDayPv: Number(summary?.previous_seven_day_pv || 0),
        },
        daily,
        hourly,
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
        dimensions,
        generatedAt: new Date().toISOString(),
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
