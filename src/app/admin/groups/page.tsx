'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredAdminToken, redirectToAdminLogin, verifyStoredAdminToken } from '@/lib/admin-client-auth'

interface GroupPhoto {
  id: string
  title: string
  imageUrl: string
  thumbnailUrl: string | null
}

interface GroupItem {
  id: string
  title: string
  description: string | null
  category: string
  coverPhotoId: string | null
  location: string | null
  shotAt: string | null
  sortOrder: number
  published: boolean
  photos: GroupPhoto[]
}

interface GroupForm {
  title: string
  description: string
  category: string
  coverPhotoId: string
  location: string
  shotAt: string
  sortOrder: number
  published: boolean
}

const emptyForm: GroupForm = {
  title: '',
  description: '',
  category: '',
  coverPhotoId: '',
  location: '',
  shotAt: '',
  sortOrder: 0,
  published: true,
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<GroupItem[]>([])
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GroupForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  const getToken = useCallback(() => getStoredAdminToken(), [])

  const loadData = useCallback(async () => {
    const token = await verifyStoredAdminToken(router)
    if (!token) {
      return
    }
    setLoading(true)
    try {
      const [groupRes, categoryRes] = await Promise.all([
        fetch('/api/admin/groups', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/categories'),
      ])
      if (groupRes.status === 401) {
        redirectToAdminLogin(router)
        return
      }
      const groupData = await groupRes.json()
      const categoryData = await categoryRes.json()
      setGroups(groupData.data || [])
      setCategories(categoryData.data || [])
    } catch {
      setGroups([])
      setMessage('作品组加载失败')
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: groups.length })
    setShowForm(true)
  }

  const openEdit = (group: GroupItem) => {
    setEditingId(group.id)
    setForm({
      title: group.title,
      description: group.description || '',
      category: group.category,
      coverPhotoId: group.coverPhotoId || '',
      location: group.location || '',
      shotAt: group.shotAt ? group.shotAt.slice(0, 10) : '',
      sortOrder: group.sortOrder,
      published: group.published,
    })
    setShowForm(true)
  }

  const saveGroup = async (event: React.FormEvent) => {
    event.preventDefault()
    const token = getToken()
    if (!token) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(editingId ? `/api/admin/groups/${editingId}` : '/api/admin/groups', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存失败')
      setMessage(editingId ? '作品组已更新' : '作品组已创建，现在可以上传照片到该组')
      setError(false)
      setShowForm(false)
      await loadData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  const deleteGroup = async (group: GroupItem) => {
    if (!confirm(`删除作品组“${group.title}”？组内照片会保留，并变为未分组。`)) return
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '删除失败')
      setMessage('作品组已删除，照片已保留')
      setError(false)
      loadData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '删除失败')
      setError(true)
    }
  }

  const editingGroup = groups.find((group) => group.id === editingId)
  const coverPreview = editingGroup?.photos.find((photo) => photo.id === form.coverPhotoId)
    || editingGroup?.photos[0]

  return (
    <div className="min-h-screen px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">作品组管理</h1>
            <p className="mt-1 text-sm text-white/40">把同一次拍摄或同一个主题整理成完整作品集</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={openCreate} className="rounded-lg bg-white/15 px-5 py-2.5 text-sm font-medium hover:bg-white/25">
              + 新建作品组
            </button>
            <a href="/admin/photos" className="rounded-lg bg-white/5 px-5 py-2.5 text-sm text-white/55 hover:bg-white/10 hover:text-white/80">
              照片管理
            </a>
            <a href="/admin" className="text-sm text-white/40 hover:text-white/70">返回管理</a>
          </div>
        </div>

        {message && (
          <div className={`mb-6 rounded-lg px-4 py-2 text-xs ${error ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center text-sm text-white/30">正在加载...</div>
        ) : groups.length === 0 ? (
          <div className="border-y border-white/10 py-24 text-center">
            <p className="text-sm text-white/35">还没有作品组</p>
            <button onClick={openCreate} className="mt-5 text-sm text-accent/80 hover:text-accent">创建第一组作品</button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const cover = group.photos.find((photo) => photo.id === group.coverPhotoId) || group.photos[0]
              return (
                <article key={group.id} className="overflow-hidden rounded-lg border border-white/10 bg-surface">
                  <div className="aspect-[4/3] bg-white/[0.03]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.thumbnailUrl || cover.imageUrl} alt={group.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/20">等待组内照片</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h2 className="font-medium">{group.title}</h2>
                      <span className={`shrink-0 text-[10px] ${group.published ? 'text-success' : 'text-white/30'}`}>
                        {group.published ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <p className="text-xs text-white/35">{group.category} · {group.photos.length} 张照片</p>
                    {(group.location || group.shotAt) && (
                      <p className="mt-2 truncate text-xs text-white/25">
                        {[group.location, group.shotAt?.slice(0, 10)].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => openEdit(group)} className="flex-1 rounded-lg bg-white/10 py-2 text-sm hover:bg-white/20">编辑</button>
                      <button onClick={() => deleteGroup(group)} className="flex-1 rounded-lg bg-danger/15 py-2 text-sm text-danger hover:bg-danger/25">删除</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-surface p-5 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-6 text-lg font-bold">{editingId ? '编辑作品组' : '新建作品组'}</h2>
            <form onSubmit={saveGroup} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="标题 *">
                  <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputClass} />
                </Field>
                <Field label="分类 *">
                  <select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value, coverPhotoId: '' })} className={inputClass}>
                    <option value="" className="bg-surface">选择分类</option>
                    {categories.map((category) => <option key={category.slug} value={category.slug} className="bg-surface">{category.label}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="作品组描述">
                    <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} resize-none`} />
                  </Field>
                </div>
                <Field label="拍摄地点">
                  <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={inputClass} />
                </Field>
                <Field label="拍摄日期">
                  <input type="date" value={form.shotAt} onChange={(event) => setForm({ ...form, shotAt: event.target.value })} className={inputClass} />
                </Field>
                <Field label="排序">
                  <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) || 0 })} className={inputClass} />
                </Field>
                <Field label="组封面">
                  <select
                    value={form.coverPhotoId}
                    disabled={!editingGroup?.photos.length}
                    onChange={(event) => setForm({ ...form, coverPhotoId: event.target.value })}
                    className={inputClass}
                  >
                    <option value="" className="bg-surface">自动使用组内第一张</option>
                    {editingGroup?.photos.map((photo) => <option key={photo.id} value={photo.id} className="bg-surface">{photo.title}</option>)}
                  </select>
                </Field>
              </div>

              {coverPreview && (
                <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview.thumbnailUrl || coverPreview.imageUrl} alt="封面预览" className="aspect-[16/7] w-full object-cover" />
                </div>
              )}

              {!editingId && <p className="text-xs text-white/30">创建后，在照片管理中批量上传到此作品组，再回来选择组封面。</p>}
              <label className="flex items-center gap-2 text-xs text-white/45">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="accent-white" />
                前台发布此作品组
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-white/10 px-5 py-2.5 text-sm text-white/55 hover:bg-white/20">取消</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-white/20 px-5 py-2.5 text-sm hover:bg-white/30 disabled:opacity-40">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs text-white/40">{label}</span>{children}</label>
}

const inputClass = 'w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white/30 disabled:opacity-35'
