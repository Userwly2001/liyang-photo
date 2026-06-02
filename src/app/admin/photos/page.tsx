'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface PhotoItem {
  id: string
  title: string
  description: string | null
  category: string
  imageUrl: string
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  focalLength: string | null
  aperture: string | null
  iso: string | null
  shutterSpeed: string | null
  camera: string | null
  lens: string | null
  tags: string[]
  featured: boolean
  sortOrder: number
  published: boolean
  createdAt: string
}

interface PhotoForm {
  title: string
  description: string
  category: string
  focalLength: string
  aperture: string
  iso: string
  shutterSpeed: string
  camera: string
  lens: string
  tags: string
  featured: boolean
  sortOrder: number
  published: boolean
}

const emptyForm: PhotoForm = {
  title: '',
  description: '',
  category: '',
  focalLength: '',
  aperture: '',
  iso: '',
  shutterSpeed: '',
  camera: '',
  lens: '',
  tags: '',
  featured: false,
  sortOrder: 0,
  published: true,
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PhotoForm>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([])
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatLabel, setNewCatLabel] = useState('')
  const [showCatManager, setShowCatManager] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    setIsAuth(true)
    fetchPhotos()
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPhotos = async () => {
    const token = getToken()
    if (!token) return
    try {
      setLoading(true)
      const params = categoryFilter ? `?category=${categoryFilter}` : ''
      const res = await fetch(`/api/admin/photos${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/admin/login')
        return
      }
      const data = await res.json()
      setPhotos(data.data || [])
    } catch {
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuth) { fetchPhotos(); fetchCategories(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter])

  const openCreateForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFile(null)
    setShowForm(true)
  }

  const openEditForm = (photo: PhotoItem) => {
    setForm({
      title: photo.title,
      description: photo.description || '',
      category: photo.category,
      focalLength: photo.focalLength || '',
      aperture: photo.aperture || '',
      iso: photo.iso || '',
      shutterSpeed: photo.shutterSpeed || '',
      camera: photo.camera || '',
      lens: photo.lens || '',
      tags: photo.tags.join(', '),
      featured: photo.featured,
      sortOrder: photo.sortOrder,
      published: photo.published,
    })
    setEditingId(photo.id)
    setFile(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) return

    setSubmitting(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('category', form.category)
      formData.append('focalLength', form.focalLength)
      formData.append('aperture', form.aperture)
      formData.append('iso', form.iso)
      formData.append('shutterSpeed', form.shutterSpeed)
      formData.append('camera', form.camera)
      formData.append('lens', form.lens)
      formData.append('tags', form.tags)
      formData.append('featured', String(form.featured))
      formData.append('sortOrder', String(form.sortOrder))
      formData.append('published', String(form.published))

      if (editingId) {
        // Update existing
        const res = await fetch(`/api/admin/photos/${editingId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Update failed')
        }
        setMessage('照片已更新')
      } else {
        // Create new
        if (!file) {
          setMessage('请选择图片文件')
          setMessageType('error')
          setSubmitting(false)
          return
        }
        formData.append('file', file)
        const res = await fetch('/api/admin/photos', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }
        setMessage('照片已上传')
      }

      setMessageType('success')
      setShowForm(false)
      fetchPhotos()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch { /* ignore */ }
  }

  const addCategory = async () => {
    const token = getToken()
    if (!token || !newCatSlug.trim() || !newCatLabel.trim()) return
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug: newCatSlug.trim(), label: newCatLabel.trim(), sortOrder: categories.length }),
      })
      if (res.ok) {
        setNewCatSlug('')
        setNewCatLabel('')
        fetchCategories()
      }
    } catch { /* ignore */ }
  }

  const removeCategory = async (slug: string) => {
    const token = getToken()
    if (!token) return
    if (!confirm(`确定删除分类 "${slug}"？`)) return
    try {
      const res = await fetch(`/api/admin/categories?slug=${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) fetchCategories()
    } catch { /* ignore */ }
  }

  const deletePhoto = async (id: string) => {
    if (!confirm('确定删除此照片？')) return
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch(`/api/admin/photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id))
        setMessage('照片已删除')
        setMessageType('success')
      }
    } catch {
      setMessage('删除失败')
      setMessageType('error')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (!isAuth) return null

  return (
    <div className="min-h-screen px-6 py-28">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">照片管理</h1>
            <p className="text-sm text-white/40 mt-1">共 {photos.length} 张照片</p>
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={openCreateForm}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              + 上传照片
            </button>
            <a
              href="/admin"
              className="px-5 py-2.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors"
            >
              留言管理
            </a>
            <a
              href="/admin/blog"
              className="px-5 py-2.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors"
            >
              博客管理
            </a>
            <button
              onClick={handleLogout}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 px-4 py-2 rounded-lg text-xs ${
            messageType === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {message}
          </div>
        )}

        {/* Category filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-5 py-2.5 text-sm rounded-lg transition-colors ${
              categoryFilter === '' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategoryFilter(cat.slug)}
              className={`px-5 py-2.5 text-sm rounded-lg transition-colors ${
                categoryFilter === cat.slug ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <button
            onClick={() => setShowCatManager(!showCatManager)}
            className="px-5 py-2.5 text-sm rounded-lg bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
          >
            {showCatManager ? '收起' : '+ 管理分类'}
          </button>
        </div>

        {/* Category manager panel */}
        <AnimatePresence>
          {showCatManager && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-4 rounded-lg border border-white/10 bg-surface">
                <h3 className="text-sm font-medium mb-3">管理分类</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="分类标识（英文）"
                    className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                  <input
                    type="text"
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="显示名称（中文）"
                    className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={addCategory}
                    disabled={!newCatSlug.trim() || !newCatLabel.trim()}
                    className="px-4 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 transition-colors"
                  >
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.slug}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-sm"
                    >
                      <span className="text-white/60">{cat.label}</span>
                      <span className="text-white/20">({cat.slug})</span>
                      <button
                        onClick={() => removeCategory(cat.slug)}
                        className="text-white/20 hover:text-danger transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload/Edit form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="w-full max-w-xl bg-surface border border-white/10 rounded-xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold mb-6">{editingId ? '编辑照片' : '上传照片'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* File input (only for new photos) */}
                  {!editingId && (
                    <div>
                      <label className="text-xs text-white/40 block mb-1">图片文件 *</label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-white/20 transition-colors"
                      >
                        {file ? (
                          <div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={URL.createObjectURL(file)}
                              alt="预览"
                              className="max-h-48 mx-auto rounded-lg mb-2 object-contain"
                            />
                            <p className="text-xs text-white/60">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
                          </div>
                        ) : (
                          <p className="text-xs text-white/30">点击选择图片文件（支持横竖屏）</p>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null
                            setFile(f)
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs text-white/40 block mb-1">标题 *</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-white/40 block mb-1">描述</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={2}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">分类 *</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                      >
                        <option value="" className="bg-surface" disabled>选择分类</option>
                        {categories.map((cat) => (
                          <option key={cat.slug} value={cat.slug} className="bg-surface">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">排序</label>
                      <input
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">焦距</label>
                      <input
                        type="text"
                        value={form.focalLength}
                        onChange={(e) => setForm({ ...form, focalLength: e.target.value })}
                        placeholder="e.g. 85mm"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">光圈</label>
                      <input
                        type="text"
                        value={form.aperture}
                        onChange={(e) => setForm({ ...form, aperture: e.target.value })}
                        placeholder="e.g. 1.4"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">ISO</label>
                      <input
                        type="text"
                        value={form.iso}
                        onChange={(e) => setForm({ ...form, iso: e.target.value })}
                        placeholder="e.g. 200"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">快门速度</label>
                      <input
                        type="text"
                        value={form.shutterSpeed}
                        onChange={(e) => setForm({ ...form, shutterSpeed: e.target.value })}
                        placeholder="e.g. 1/250"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">相机</label>
                      <input
                        type="text"
                        value={form.camera}
                        onChange={(e) => setForm({ ...form, camera: e.target.value })}
                        placeholder="e.g. Sony A7R V"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">镜头</label>
                      <input
                        type="text"
                        value={form.lens}
                        onChange={(e) => setForm({ ...form, lens: e.target.value })}
                        placeholder="e.g. 85mm f/1.4 GM"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-white/40 block mb-1">标签（逗号分隔）</label>
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="e.g. 自然光, 人像, 城市"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-white/40">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="accent-white"
                      />
                      精选
                    </label>
                    <label className="flex items-center gap-2 text-xs text-white/40">
                      <input
                        type="checkbox"
                        checked={form.published}
                        onChange={(e) => setForm({ ...form, published: e.target.checked })}
                        className="accent-white"
                      />
                      已发布
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 text-sm rounded-lg bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 text-sm rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 transition-colors flex items-center gap-2"
                    >
                      {submitting && (
                        <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                      )}
                      {editingId ? '保存' : '上传'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo list */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-24 text-white/20 text-sm">暂无照片</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="rounded-lg border border-white/10 bg-surface overflow-hidden group"
              >
                <div className="aspect-[3/2] bg-surface-hover relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumbnailUrl || photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {photo.featured && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">精选</span>
                    )}
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                      photo.published ? 'bg-success/10 text-success' : 'bg-white/5 text-white/30'
                    }`}>
                      {photo.published ? '已发布' : '草稿'}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium truncate">{photo.title}</h3>
                  <p className="text-[10px] text-white/30 mt-1">
                    {photo.category} · {photo.focalLength || '-'} · f/{photo.aperture || '-'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditForm(photo)}
                      className="flex-1 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="flex-1 py-2 text-sm rounded-lg bg-danger/15 text-danger hover:bg-danger/25 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
