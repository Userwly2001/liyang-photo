'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  title: string
  bio: string
  avatar: string
  email: string
  instagram: string
  wechat: string
  location: string
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()

  const getToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_token')
  }

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/admin/login'); return }
    setIsAuth(true)
    loadProfile()
  }, [router])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.data)
        setForm(data.data)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    const token = getToken()
    if (!token) return
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('保存失败')
      setMessage('个人资料已更新')
      setMessageType('success')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (!isAuth || loading) return null

  return (
    <div className="min-h-screen px-6 py-28">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">个人资料</h1>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm text-white/40 hover:text-white/70 transition-colors">返回管理</a>
            <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white/70 transition-colors">退出登录</button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-2 rounded-lg text-xs ${
            messageType === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4 p-6 rounded-xl border border-white/10 bg-surface">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-1">姓名</label>
              <input
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">头衔</label>
              <input
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 摄影师"
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1">个人简介</label>
            <textarea
              value={form.bio || ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={5}
              className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-1">邮箱</label>
              <input
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">所在城市</label>
              <input
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. 上海"
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Instagram</label>
              <input
                value={form.instagram || ''}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="e.g. @leonwang"
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">微信</label>
              <input
                value={form.wechat || ''}
                onChange={(e) => setForm({ ...form, wechat: e.target.value })}
                className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-sm rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
