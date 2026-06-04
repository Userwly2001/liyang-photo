'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  title: string
  bio: string
  avatar: string
  heroImage: string
  email: string
  instagram: string
  wechat: string
  location: string
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isAuth, setIsAuth] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_token')
  }, [])

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/profile')
      if (res.ok) {
        const data = await res.json()
        setForm(data.data)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const init = async () => {
      const token = getToken()
      if (!token) {
        router.push('/admin/login')
        return
      }
      await loadProfile()
      setIsAuth(true)
    }
    init()
  }, [getToken, loadProfile, router])

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
      const data = await res.json().catch(() => null)
      if (res.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
        throw new Error('登录已过期，请重新登录后保存')
      }
      if (!res.ok) throw new Error(data?.error || '保存失败')
      setMessage('个人资料已更新')
      setMessageType('success')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const handleHeroUpload = async (file?: File) => {
    if (!file) return
    setUploadingHero(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('files', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '上传失败')

      const uploaded = data.data?.[0]
      if (!uploaded?.url) throw new Error('上传失败')

      setForm((prev) => ({ ...prev, heroImage: uploaded.url }))
      setMessage('封面图已上传，记得点击保存')
      setMessageType('success')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '上传失败')
      setMessageType('error')
    } finally {
      setUploadingHero(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (!isAuth || loading) return null

  return (
    <div className="min-h-screen px-4 py-24 sm:px-6 sm:py-28">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">个人资料</h1>
          <div className="flex flex-wrap items-center gap-3">
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

        <div className="space-y-6 rounded-xl border border-white/10 bg-surface p-4 sm:p-6">
          <div>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">首页封面图</h2>
                <p className="text-xs text-white/30 mt-1">
                  建议使用横图，主体靠右或居中偏右，左侧留给首页标题。
                </p>
              </div>
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                disabled={uploadingHero}
                className="px-4 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
              >
                {uploadingHero ? '上传中...' : '上传封面'}
              </button>
            </div>

            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleHeroUpload(e.target.files?.[0])
                e.target.value = ''
              }}
            />

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label className="text-xs text-white/40 block mb-1">封面图片 URL</label>
                <input
                  value={form.heroImage || ''}
                  onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                  placeholder="/uploads/your-cover.jpg"
                  className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                />
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, heroImage: '' })}
                    className="text-xs text-white/35 hover:text-white/65 transition-colors"
                  >
                    清空，使用精选第一张
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30 aspect-video">
                {form.heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.heroImage}
                    alt="首页封面预览"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/20">
                    暂无封面
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
