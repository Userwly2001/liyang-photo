'use client'

import { useEffect, useState } from 'react'

interface DailyStats {
  [date: string]: number
}

function getColor(count: number): string {
  if (count === 0) return 'bg-white/[0.03]'
  if (count <= 1) return 'bg-green-900/40'
  if (count <= 2) return 'bg-green-800/50'
  if (count <= 4) return 'bg-green-700/60'
  if (count <= 8) return 'bg-green-500/70'
  return 'bg-green-400/80'
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default function VisitHeatmap() {
  const [stats, setStats] = useState<DailyStats>({})
  const [total, setTotal] = useState(0)
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        setStats(d.daily || {})
        setTotal(d.total || 0)
      })
      .catch(() => {})
  }, [])

  // Generate 53 weeks × 7 days grid like GitHub
  const today = new Date()
  const endDate = new Date(today)
  // Align end to Saturday (GitHub style: Sunday is last column)
  const dayOfWeek = endDate.getDay()
  endDate.setDate(endDate.getDate() + (6 - dayOfWeek))

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 52 * 7 + 1)

  const weeks: { date: string; day: number }[][] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    const week: { date: string; day: number }[] = []
    for (let d = 0; d < 7; d++) {
      week.push({ date: formatDate(current), day: current.getDay() })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  const dayLabels = ['', '一', '', '三', '', '五', '']

  return (
    <section className="py-32 px-6 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-2 text-center">
          访问统计
        </p>
        <p className="text-4xl sm:text-5xl font-bold text-center mb-2">
          {(total || 0).toLocaleString()}
        </p>
        <p className="text-sm text-white/30 text-center mb-12">次访问</p>

        <div className="overflow-x-auto pb-4">
      <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 ml-8">
          {weeks.map((week, wi) => {
            const d = new Date(week[0].date)
            if (d.getDate() <= 7 && (wi === 0 || d.getMonth() !== new Date(weeks[wi - 1]?.[0]?.date || '').getMonth())) {
              const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
              return (
                <span key={wi} className="text-[10px] text-white/20 w-[12px]" style={{ flexShrink: 0 }}>
                  {months[d.getMonth()]}
                </span>
              )
            }
            return <span key={wi} className="text-[10px] w-[12px]" style={{ flexShrink: 0 }} />
          })}
        </div>

        {/* Grid with day labels */}
        <div className="flex gap-[3px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 pt-[3px]">
            {dayLabels.map((label, i) => (
              <span key={i} className="text-[10px] text-white/10 w-5 text-right leading-[12px] h-[12px]">
                {label}
              </span>
            ))}
          </div>

          {/* Heatmap cells */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => {
                const count = stats[day.date] || 0
                return (
                  <div
                    key={day.date}
                    className={`w-[12px] h-[12px] rounded-sm ${getColor(count)} cursor-pointer hover:ring-1 hover:ring-white/30 transition-all`}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setTooltip({ date: day.date, count, x: rect.left, y: rect.top })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-2 ml-8 text-[10px] text-white/20">
          <span>少</span>
          {[0, 1, 2, 4, 8].map((n) => (
            <div key={n} className={`w-[12px] h-[12px] rounded-sm ${getColor(n)}`} />
          ))}
          <span>多</span>
        </div>
      </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 rounded bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-white/80 pointer-events-none"
            style={{ left: tooltip.x - 40, top: tooltip.y - 32 }}
          >
            {tooltip.date} — {tooltip.count} 次访问
          </div>
        )}
      </div>
    </div>
    </section>
  )
}
