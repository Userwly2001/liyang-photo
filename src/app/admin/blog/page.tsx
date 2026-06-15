'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MarkdownEditor from '@/components/Admin/MarkdownEditor'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  tags: string[]
  published: boolean
  createdAt: string
  updatedAt: string
}

const emptyForm = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  tags: '',
  published: false,
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const router = useRouter()

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_token')
  }, [])

  const fetchPosts = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch('/api/admin/blog', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/admin/login'); return }
      const data = await res.json()
      setPosts(data.data || [])
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [getToken, router])

  useEffect(() => {
    const init = async () => {
      const token = getToken()
      if (!token) {
        router.push('/admin/login')
        return
      }
      await fetchPosts()
      setIsAuth(true)
    }
    init()
  }, [fetchPosts, getToken, router])

  const openCreateForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const openEditForm = (post: BlogPost) => {
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      tags: post.tags.join(', '),
      published: post.published,
    })
    setEditingId(post.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) return

    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setMessage('标题、Slug 和内容不能为空')
      setMessageType('error')
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        content: form.content.trim(),
        excerpt: form.excerpt.trim() || null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        published: form.published,
      }

      const url = editingId ? `/api/admin/blog/${editingId}` : '/api/admin/blog'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }

      setMessage(editingId ? '文章已更新' : '文章已创建')
      setMessageType('success')
      setShowForm(false)
      fetchPosts()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('确定删除此文章？')) return
    const token = getToken()
    if (!token) return

    try {
      await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setMessage('文章已删除')
      setMessageType('success')
    } catch {
      setMessage('删除失败')
      setMessageType('error')
    }
  }

  const generateSlug = (title: string) => {
    // If title contains non-ASCII characters (e.g. Chinese), use timestamp
    if (/[^\x00-\x7F]/.test(title)) {
      return `post-${Date.now()}`
    }
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/admin/login')
  }

  if (!isAuth) return null

  return (
    <div className="min-h-screen px-4 py-24 sm:px-6 sm:py-28">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">随笔管理</h1>
            <p className="text-sm text-white/40 mt-1">共 {posts.length} 篇文章</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateForm}
              className="px-4 py-2.5 text-sm font-medium rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors sm:px-5"
            >
              + 写随笔
            </button>
            <a
              href="/admin"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors sm:px-5"
            >
              留言管理
            </a>
            <a
              href="/admin/photos"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors sm:px-5"
            >
              照片管理
            </a>
            <a
              href="/admin/groups"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors sm:px-5"
            >
              作品组管理
            </a>
            <a
              href="/admin/settings"
              className="px-4 py-2.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors sm:px-5"
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

        {message && (
          <div className={`mb-6 px-4 py-2 rounded-lg text-xs ${
            messageType === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {message}
          </div>
        )}

        {/* Editor modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="my-4 flex max-h-[94vh] w-full max-w-6xl flex-col rounded-xl border border-white/10 bg-surface sm:my-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="border-b border-white/10 px-4 pb-2 pt-5 shrink-0 sm:px-6 sm:pt-6">
                  <h2 className="text-lg font-bold">{editingId ? '编辑随笔' : '写随笔'}</h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs text-white/40 block mb-1">标题 *</label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          onBlur={(e) => {
                            if (!form.slug && e.target.value) {
                              setForm({ ...form, slug: generateSlug(e.target.value) })
                            }
                          }}
                          required
                          className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 block mb-1">Slug *（URL 标识）</label>
                        <input
                          type="text"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          required
                          className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/40 block mb-1">摘要</label>
                      <input
                        type="text"
                        value={form.excerpt}
                        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/40 block mb-1">标签（逗号分隔，用于前台栏目筛选）</label>
                      <input
                        type="text"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="e.g. 摄影, 生活, 随笔, 城市, 作品笔记"
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-h-[430px]">
                      <label className="text-xs text-white/40 block mb-1">
                        内容 *（Markdown 格式）
                      </label>
                      <MarkdownEditor
                        value={form.content}
                        onChange={(content) => setForm((current) => ({ ...current, content }))}
                        getToken={getToken}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs text-white/40">
                      <input
                        type="checkbox"
                        checked={form.published}
                        onChange={(e) => setForm({ ...form, published: e.target.checked })}
                        className="accent-white"
                      />
                      发布（勾选后公开可见）
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-white/10 px-4 py-4 shrink-0 sm:px-6">
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
                      {editingId ? '保存' : '创建'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post list */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-5 h-5 border border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-white/20 text-sm">暂无文章</div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-lg border border-white/10 bg-surface"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium truncate">{post.title}</h3>
                      <span className={`shrink-0 px-2 py-0.5 text-[10px] rounded-full ${
                        post.published ? 'bg-success/10 text-success' : 'bg-white/5 text-white/30'
                      }`}>
                        {post.published ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      /blog/{post.slug} · {new Date(post.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                    {post.excerpt && (
                      <p className="text-xs text-white/30 mt-1 line-clamp-1">{post.excerpt}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditForm(post)}
                      className="px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="px-4 py-2 text-sm rounded-lg bg-danger/15 text-danger hover:bg-danger/25 transition-colors"
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
