'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { MessageType } from '@/types'

export default function AdminDashboard() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
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
        const res = await fetch('/api/messages?status=pending&limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) {
          localStorage.removeItem('admin_token')
          router.push('/admin/login')
          return
        }
        const data = await res.json()
        setMessages(data.data || [])

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
