'use client'

import { useMemo, useState } from 'react'

type Metric = 'uv' | 'pv'
type Range = 7 | 30

type RankedStat = {
  value: string
  uv: number
  pv: number
}

export type StatsData = {
  summary: {
    totalUv: number
    totalPv: number
    todayUv: number
    todayPv: number
    yesterdayUv: number
    yesterdayPv: number
    sevenDayUv: number
    sevenDayPv: number
    previousSevenDayUv: number
    previousSevenDayPv: number
  }
  daily: { date: string; uv: number; pv: number }[]
  hourly: { hour: string; uv: number; pv: number }[]
  sections: { section: string; uv: number; pv: number }[]
  events: { event: string; today: number; sevenDays: number }[]
  dimensions: {
    path: RankedStat[]
    source: RankedStat[]
    device: RankedStat[]
    browser: RankedStat[]
    os: RankedStat[]
    country: RankedStat[]
    language: RankedStat[]
  }
  generatedAt: string
}

const sectionLabels: Record<string, string> = {
  home: '首页',
  gallery: '相册',
  blog: '随笔',
  ielts_vocab: '雅思刷词',
  ielts_listening: '雅思听力',
  other: '其他页面',
}

const deviceLabels: Record<string, string> = {
  desktop: '桌面设备',
  mobile: '手机',
  tablet: '平板',
}

const countryLabels: Record<string, string> = {
  CN: '中国大陆',
  HK: '中国香港',
  TW: '中国台湾',
  MO: '中国澳门',
  JP: '日本',
  SG: '新加坡',
  US: '美国',
  GB: '英国',
  AU: '澳大利亚',
  CA: '加拿大',
  DE: '德国',
  FR: '法国',
  KR: '韩国',
  未知: '未知地区',
}

const languageLabels: Record<string, string> = {
  zh: '中文',
  en: '英文',
  ja: '日文',
  ko: '韩文',
  fr: '法文',
  de: '德文',
  未知: '未知语言',
}

function formatNumber(value: number) {
  return value.toLocaleString('zh-CN')
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function Change({ current, previous, label }: { current: number; previous: number; label: string }) {
  const change = percentChange(current, previous)
  const positive = change > 0
  return (
    <span className={`text-[11px] tabular-nums ${positive ? 'text-emerald-400/65' : change < 0 ? 'text-rose-400/65' : 'text-white/25'}`}>
      {positive ? '↑' : change < 0 ? '↓' : '—'} {Math.abs(change)}% {label}
    </span>
  )
}

function MetricBlock({
  label,
  value,
  detail,
}: {
  label: string
  value: number | string
  detail: React.ReactNode
}) {
  return (
    <div className="min-w-0 border-l border-white/8 px-4 py-4 first:border-l-0 sm:px-5">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-white/90">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <div className="mt-1.5 min-h-4">{detail}</div>
    </div>
  )
}

function TrendChart({ data, metric }: { data: StatsData['daily']; metric: Metric }) {
  const width = 760
  const height = 250
  const padding = { top: 18, right: 12, bottom: 28, left: 42 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const values = data.map((item) => item[metric])
  const maxValue = Math.max(...values, 1)
  const points = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * innerWidth
    const y = padding.top + innerHeight - (item[metric] / maxValue) * innerHeight
    return { x, y, item }
  })
  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `${padding.left},${padding.top + innerHeight} ${line} ${padding.left + innerWidth},${padding.top + innerHeight}`
  const gridValues = maxValue <= 3
    ? Array.from({ length: maxValue + 1 }, (_, index) => index / maxValue)
    : [0, 0.25, 0.5, 0.75, 1]

  return (
    <div>
      <div className="aspect-[3/1] min-h-[210px] w-full min-w-0 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={`${metric.toUpperCase()} 访问趋势`}>
          {gridValues.map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight
            return (
              <g key={ratio}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                <text x={padding.left - 9} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10">
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            )
          })}
          <polygon points={area} fill="rgba(196,151,62,0.10)" />
          <polyline points={line} fill="none" stroke="rgb(196,151,62)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {points.map(({ x, y, item }) => (
            <circle key={item.date} cx={x} cy={y} r="3.5" fill="#0a0a0a" stroke="rgb(214,174,91)" strokeWidth="2" vectorEffect="non-scaling-stroke">
              <title>{`${item.date} · ${metric.toUpperCase()} ${formatNumber(item[metric])}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="ml-[42px] flex justify-between text-[10px] tabular-nums text-white/25">
        <span>{data[0]?.date.slice(5).replace('-', '/')}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5).replace('-', '/')}</span>
        <span>{data[data.length - 1]?.date.slice(5).replace('-', '/')}</span>
      </div>
    </div>
  )
}

function HourlyChart({ data }: { data: StatsData['hourly'] }) {
  const max = Math.max(...data.map((item) => item.pv), 1)
  return (
    <div className="flex h-44 items-end gap-1 border-b border-white/10 pt-4">
      {data.map((item, index) => (
        <div key={item.hour} className="group relative flex h-full min-w-0 flex-1 items-end">
          <div
            className="w-full min-h-px bg-accent/35 transition-colors group-hover:bg-accent/80"
            style={{ height: `${Math.max((item.pv / max) * 100, item.pv > 0 ? 3 : 0)}%` }}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap border border-white/10 bg-background px-2 py-1 text-[10px] text-white/65 group-hover:block">
            {item.hour}:00 · PV {formatNumber(item.pv)} · UV {formatNumber(item.uv)}
          </div>
          {index % 4 === 0 && (
            <span className="absolute -bottom-6 left-0 text-[9px] tabular-nums text-white/25">{item.hour}:00</span>
          )}
        </div>
      ))}
    </div>
  )
}

function Distribution({
  title,
  items,
  label,
  limit = 6,
}: {
  title: string
  items: RankedStat[]
  label?: (value: string) => string
  limit?: number
}) {
  const visibleItems = items.slice(0, limit)
  const total = visibleItems.reduce((sum, item) => sum + item.pv, 0)

  return (
    <section className="border-t border-white/10 pt-5">
      <h3 className="mb-5 text-xs font-medium text-white/40">{title}</h3>
      {visibleItems.length === 0 ? (
        <p className="py-8 text-sm text-white/20">部署新版本后开始积累数据</p>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => {
            const percentage = total > 0 ? Math.round((item.pv / total) * 100) : 0
            return (
              <div key={item.value}>
                <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
                  <span className="truncate text-white/60">{label ? label(item.value) : item.value}</span>
                  <span className="shrink-0 tabular-nums text-white/35">{percentage}% · {formatNumber(item.pv)} PV</span>
                </div>
                <div className="h-1 overflow-hidden bg-white/5">
                  <div className="h-full bg-accent/65" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function pathLabel(path: string) {
  if (path === '/') return '首页'
  if (path === '/gallery') return '全部相册'
  if (path === '/blog') return '随笔列表'
  if (path === '/about') return '关于'
  if (path === '/guestbook') return '留言'
  if (path.startsWith('/gallery/photo/')) return `照片 · ${path.split('/').pop()?.slice(0, 8)}…`
  if (path.startsWith('/gallery/group/')) return `作品组 · ${path.split('/').pop()?.slice(0, 8)}…`
  if (path.startsWith('/blog/')) return `随笔 · ${decodeURIComponent(path.split('/').pop() || '')}`
  return path
}

function sourceLabel(source: string) {
  if (source === '直接访问' || source === '站内跳转') return source
  if (source.startsWith('utm:')) return `推广 · ${source.slice(4)}`
  if (source.includes('google.')) return 'Google'
  if (source.includes('baidu.')) return '百度'
  if (source.includes('bing.')) return 'Bing'
  return source
}

export default function StatsDashboard({ stats }: { stats: StatsData }) {
  const [range, setRange] = useState<Range>(30)
  const [metric, setMetric] = useState<Metric>('pv')
  const trend = useMemo(() => stats.daily.slice(-range), [stats.daily, range])
  const averagePages = stats.summary.sevenDayUv > 0
    ? (stats.summary.sevenDayPv / stats.summary.sevenDayUv).toFixed(1)
    : '0.0'

  return (
    <section className="mb-14 border-y border-white/10 py-7">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-accent/60">Audience overview</p>
          <h2 className="text-xl font-semibold">访问分析</h2>
          <p className="mt-1.5 text-xs text-white/35">匿名 UV、页面 PV 与访问来源，按北京时间统计</p>
        </div>
        <p className="text-[11px] text-white/25">更新于 {new Date(stats.generatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="grid grid-cols-2 overflow-hidden border-y border-white/8 sm:grid-cols-3 lg:grid-cols-6">
        <MetricBlock
          label="今日访客"
          value={stats.summary.todayUv}
          detail={<Change current={stats.summary.todayUv} previous={stats.summary.yesterdayUv} label="较昨日" />}
        />
        <MetricBlock
          label="今日浏览"
          value={stats.summary.todayPv}
          detail={<Change current={stats.summary.todayPv} previous={stats.summary.yesterdayPv} label="较昨日" />}
        />
        <MetricBlock
          label="近 7 天访客"
          value={stats.summary.sevenDayUv}
          detail={<Change current={stats.summary.sevenDayUv} previous={stats.summary.previousSevenDayUv} label="较前 7 天" />}
        />
        <MetricBlock
          label="近 7 天浏览"
          value={stats.summary.sevenDayPv}
          detail={<Change current={stats.summary.sevenDayPv} previous={stats.summary.previousSevenDayPv} label="较前 7 天" />}
        />
        <MetricBlock
          label="人均浏览"
          value={averagePages}
          detail={<span className="text-[11px] text-white/25">近 7 天 PV / UV</span>}
        />
        <MetricBlock
          label="累计访客"
          value={stats.summary.totalUv}
          detail={<span className="text-[11px] text-white/25">累计 {formatNumber(stats.summary.totalPv)} PV</span>}
        />
      </div>

      <div className="mt-10 grid min-w-0 gap-10 xl:grid-cols-[1.7fr_1fr]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-white/70">访问趋势</h3>
              <p className="mt-1 text-[11px] text-white/25">观察内容发布后的流量变化</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex border border-white/10">
                {([7, 30] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setRange(item)} className={`h-8 px-3 text-[11px] ${range === item ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/60'}`}>
                    {item} 天
                  </button>
                ))}
              </div>
              <div className="flex border border-white/10">
                {(['pv', 'uv'] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setMetric(item)} className={`h-8 px-3 text-[11px] uppercase ${metric === item ? 'bg-accent/15 text-accent' : 'text-white/30 hover:text-white/60'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <TrendChart data={trend} metric={metric} />
        </section>

        <section className="min-w-0">
          <h3 className="text-sm font-medium text-white/70">今日访问时段</h3>
          <p className="mt-1 text-[11px] text-white/25">每小时页面浏览量</p>
          <HourlyChart data={stats.hourly} />
        </section>
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-10 lg:grid-cols-2">
        <section className="border-t border-white/10 pt-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-xs font-medium text-white/40">热门页面 · 近 30 天</h3>
              <p className="mt-1 text-[10px] text-white/20">从新版本部署后开始记录具体路径</p>
            </div>
            <span className="text-[10px] text-white/20">UV / PV</span>
          </div>
          <div className="divide-y divide-white/7">
            {stats.dimensions.path.length === 0 ? (
              <p className="py-8 text-sm text-white/20">暂无具体页面数据</p>
            ) : stats.dimensions.path.slice(0, 8).map((item, index) => (
              <div key={item.value} className="grid grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-3 py-3 text-xs">
                <span className="tabular-nums text-accent/45">{String(index + 1).padStart(2, '0')}</span>
                <div className="min-w-0">
                  <p className="truncate text-white/65">{pathLabel(item.value)}</p>
                  <p className="mt-0.5 truncate font-mono text-[9px] text-white/20">{item.value}</p>
                </div>
                <span className="tabular-nums text-white/30">{formatNumber(item.uv)}</span>
                <span className="w-14 text-right tabular-nums text-white/55">{formatNumber(item.pv)}</span>
              </div>
            ))}
          </div>
        </section>

        <Distribution title="访问来源 · 近 30 天" items={stats.dimensions.source} label={sourceLabel} limit={8} />
        <Distribution title="设备类型" items={stats.dimensions.device} label={(value) => deviceLabels[value] || value} />
        <Distribution title="浏览器" items={stats.dimensions.browser} />
        <Distribution title="国家与地区" items={stats.dimensions.country} label={(value) => countryLabels[value] || value} />
        <Distribution title="访客语言" items={stats.dimensions.language} label={(value) => languageLabels[value] || value.toUpperCase()} />
      </div>

      <div className="mt-10 border-t border-white/10 pt-5">
        <h3 className="mb-4 text-xs font-medium text-white/40">内容板块 · 近 30 天</h3>
        <div className="grid gap-px overflow-hidden bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
          {stats.sections.map((item) => (
            <div key={item.section} className="flex items-center justify-between bg-background px-4 py-3 text-xs">
              <span className="text-white/55">{sectionLabels[item.section] || item.section}</span>
              <span className="tabular-nums text-white/30">UV {formatNumber(item.uv)} · <span className="text-white/55">PV {formatNumber(item.pv)}</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
