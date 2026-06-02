'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageFormProps {
  onMessageCreated: () => void
}

const MAX_IMAGES = 3
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function MessageForm({ onMessageCreated }: MessageFormProps) {
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addImages = (files: File[]) => {
    setImages((prev) => {
      const remaining = MAX_IMAGES - prev.length
      const validFiles = files.slice(0, remaining).filter((f) => f.size <= MAX_FILE_SIZE)

      if (validFiles.length < files.length && files.length > remaining) {
        setMessage(`最多上传 ${MAX_IMAGES} 张图片`)
        setIsError(true)
        setTimeout(() => setMessage(''), 3000)
      }

      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews((prevPreviews) => [...prevPreviews, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })

      return [...prev, ...validFiles]
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    )
    addImages(files)
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setMessage('请输入留言内容')
      setIsError(true)
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('nickname', nickname.trim() || 'Anonymous')
      formData.append('content', content.trim())
      formData.append('type', images.length > 0 ? 'photo_share' : 'comment')
      images.forEach((img) => formData.append('images', img))

      const res = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')

      setNickname('')
      setContent('')
      setImages([])
      setPreviews([])
      setIsError(false)
      setMessage('留言已提交！等待审核。')
      setTimeout(() => setMessage(''), 3000)
      onMessageCreated()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '提交失败')
      setIsError(true)
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="你的昵称（选填，默认为匿名）"
          className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
          maxLength={50}
        />
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="分享你的想法或照片..."
          rows={4}
          required
          className="w-full bg-transparent border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
          maxLength={1000}
        />
      </div>

      {/* Image upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? 'border-white/50 bg-white/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            addImages(files)
            e.target.value = ''
          }}
        />
        <p className="text-xs text-white/30">
          拖拽照片到此处，或点击浏览
        </p>
        <p className="text-[10px] text-white/10 mt-1">
          最多 {MAX_IMAGES} 张图片，每张不超过 10MB
        </p>
      </div>

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <AnimatePresence>
            {previews.map((preview, i) => (
              <motion.div
                key={preview}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative w-20 h-20 rounded-lg overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Preview ${i}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Message & Submit */}
      <div className="flex items-center justify-between">
        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs ${isError ? 'text-danger' : 'text-success'}`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting}
          className="ml-auto px-6 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              提交中...
            </>
          ) : (
            '发布留言'
          )}
        </button>
      </div>
    </form>
  )
}
