'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { MessageType } from '@/types'

type StatsData = {
  summary: {
    totalUv: number
    totalPv: number
    todayUv: number
    todayPv: number
    sevenDayUv: number
    sevenDayPv: number
  }
  sections: { section: string; uv: number; pv: number }[]
  events: { event: string; today: number; sevenDays: number }[]
}

const sectionLabels: Record<string, string> = {
  home: '首页',
  gallery: '图库',
  blog: '随笔',
  ielts_vocab: '雅思刷词',
  ielts_listening: '雅思听力',
  other: '其他页面',
}

export default function AdminDashboard() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [stats, setStats] = useState<StatsData | null>(null)
  const router = useRouter()

  const getToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_token')
  }

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/admin/login')
      return
    }

    const init = async () => {
      try {
        const [res, statsRes] = await Promise.all([
          fetch('/api/messages?status=pending&limit=50', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (res.status === 401) {
          localStorage.removeItem('admin_token')
          router.push('/admin/login')
          return
        }
        const data = await res.json()
        setMessages(data.data || [])
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.data || null)
        }

        const pendingRes = await fetch('/api/messages?status=pending&limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const pendingData = await pendingRes.json()
        setPendingCount(pendingData.total || 0)
        setIsAuth(true)
      } catch {
        setMessages([])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const fetchMessages = async (status = 'pending') => {
    const token = getToken()
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`/api/messages?status=${status}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      setMessages(data.data || [])
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id))
        if (status === 'approved') setPendingCount((c) => Math.max(0, c - 1))
      }
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('确定删除此留言？')) return
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id))
        setPendingCount((c) => Math.max(0, c - 1))
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (!isAuth) return null

  return (
    <div className="min-h-screen px-4 py-24 sm:px-6 sm:py-28">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">留言管理</h1>
            <p className="text-sm text-white/40 mt-1">
              {pendingCount} 条留言待审核
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/admin/groups"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors sm:px-5"
            >
              作品组管理
            </a>
            <a
              href="/admin/photos"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors sm:px-5"
            >
              照片管理
            </a>
            <a
              href="/admin/blog"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors sm:px-5"
            >
              随笔管理
            </a>
            <a
              href="/admin/settings"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors sm:px-5"
            >
              站点设置
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>

        {stats && (
          <section className="mb-10 border-y border-white/10 py-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">访问统计</h2>
                <p className="mt-1 text-xs text-white/35">UV 为匿名独立访客，PV 为页面浏览次数</p>
              </div>
              <span className="text-xs text-white/25">北京时间</span>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ['今日 UV', stats.summary.todayUv],
                ['今日 PV', stats.summary.todayPv],
                ['近 7 天 UV', stats.summary.sevenDayUv],
                ['近 7 天 PV', stats.summary.sevenDayPv],
                ['累计 UV', stats.summary.totalUv],
                ['累计 PV', stats.summary.totalPv],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-background px-4 py-4">
                  <div className="text-[11px] text-white/35">{label}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {Number(value).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase text-white/35">近 30 天页面</h3>
                <div className="divide-y divide-white/8 border-y border-white/8">
                  {stats.sections.length === 0 ? (
                    <p className="py-4 text-sm text-white/25">暂无页面数据</p>
                  ) : (
                    stats.sections.map((item) => (
                      <div key={item.section} className="grid grid-cols-[1fr_auto_auto] items-center gap-6 py-3 text-sm">
                        <span className="text-white/65">{sectionLabels[item.section] || item.section}</span>
                        <span className="tabular-nums text-white/35">UV {item.uv.toLocaleString()}</span>
                        <span className="w-20 text-right tabular-nums text-white/55">PV {item.pv.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-medium uppercase text-white/35">听力资源</h3>
                <div className="divide-y divide-white/8 border-y border-white/8">
                  {[
                    ['签名成功', 'listening_signed'],
                    ['触发限流', 'listening_rate_limited'],
                  ].map(([label, eventName]) => {
                    const item = stats.events.find((event) => event.event === eventName)
                    return (
                      <div key={eventName} className="grid grid-cols-[1fr_auto_auto] items-center gap-6 py-3 text-sm">
                        <span className="text-white/65">{label}</span>
                        <span className="tabular-nums text-white/35">今日 {(item?.today || 0).toLocaleString()}</span>
                        <span className="w-24 text-right tabular-nums text-white/55">7 天 {(item?.sevenDays || 0).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex gap-2 mb-8">
          {['pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => fetchMessages(tab)}
              className="px-5 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {tab === 'pending' ? '待审核' : tab === 'approved' ? '已通过' : '已拒绝'} {tab === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-24 text-white/20 text-sm">暂无留言</div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-4 rounded-lg border border-white/10 bg-surface"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium">{msg.nickname}</span>
                      <span className="text-[10px] text-white/20 ml-3">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      {msg.type === 'photo_share' && (
                        <span className="ml-2 text-[10px] text-blue-400/60">照片</span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/5 text-white/30">
                      {msg.ip?.slice(0, 15)}...
                    </span>
                  </div>
                  <p className="text-sm text-white/60 mb-3">{msg.content}</p>
                  {msg.images?.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {msg.images.map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-16 h-16 rounded object-cover bg-surface-hover"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(msg.id, 'approved')}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-success/15 text-success hover:bg-success/25 transition-colors"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => updateStatus(msg.id, 'rejected')}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-danger/15 text-danger hover:bg-danger/25 transition-colors"
                    >
                      拒绝
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="px-4 py-2 text-sm rounded-lg bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
