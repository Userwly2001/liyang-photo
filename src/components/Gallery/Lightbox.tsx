'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/i18n/useLanguage'
import type { PhotoType, MessageType } from '@/types'

interface LightboxProps {
  photos: PhotoType[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<MessageType[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)
  const [shareNotice, setShareNotice] = useState('')
  const commentListRef = useRef<HTMLDivElement>(null)
  const { t, lang } = useLanguage()
  const photo = photos[currentIndex]

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageLoaded(false)
    setShowComments(false)
  }, [currentIndex])

  // Fetch comments when photo changes
  useEffect(() => {
    if (!photo) return
    const fetchComments = async () => {
      setCommentsLoading(true)
      try {
        const res = await fetch(`/api/messages?status=approved&photoId=${photo.id}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.data || [])
        }
      } catch {
        setComments([])
      } finally {
        setCommentsLoading(false)
      }
    }
    fetchComments()
  }, [photo])

  useEffect(() => {
    if (!photo) return
    queueMicrotask(() => {
      setLikeCount(photo.likeCount || 0)
      setLiked(false)
      setShareNotice('')
    })

    fetch(`/api/photos/${photo.id}/like`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLiked(Boolean(data.data.liked))
          setLikeCount(data.data.likeCount || 0)
        }
      })
      .catch(() => {})
  }, [photo])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1)
          break
        case 'ArrowRight':
          onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0)
          break
      }
    },
    [currentIndex, photos.length, onClose, onNavigate]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !photo) return

    setSubmitting(true)
    setCommentError('')

    try {
      const formData = new FormData()
      formData.append('nickname', nickname.trim() || t.lightbox.anonymous)
      formData.append('content', content.trim())
      formData.append('type', 'comment')
      formData.append('photoId', photo.id)

      const res = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.lightbox.submitFailed)

      setContent('')
      // Refetch comments
      const refreshRes = await fetch(`/api/messages?status=approved&photoId=${photo.id}&limit=50`)
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setComments(refreshData.data || [])
      }
      // Scroll to top of comment list
      commentListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : t.lightbox.submitFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async () => {
    if (!photo || liking) return
    setLiking(true)
    try {
      const res = await fetch(`/api/photos/${photo.id}/like`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setLiked(Boolean(data.data.liked))
        setLikeCount(data.data.likeCount || 0)
      }
    } finally {
      setLiking(false)
    }
  }

  const handleShare = async () => {
    if (!photo) return
    const url = new URL(window.location.href)
    url.searchParams.set('photo', photo.id)
    const shareData = { title: photo.title, text: photo.description || photo.title, url: url.toString() }

    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(shareData.url)
      } catch {
        const textarea = document.createElement('textarea')
        textarea.value = shareData.url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      setShareNotice(t.lightbox.copied)
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
      await copyLink()
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        try {
          await copyLink()
        } catch {
          setShareNotice(t.lightbox.shareFailed)
        }
      }
    }
  }

  if (!photo) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex"
        onClick={onClose}
      >
        {/* Main image area */}
        <div className={`flex-1 flex items-center justify-center relative min-w-0 ${showComments ? '' : ''}`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            aria-label={t.lightbox.close}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-xs text-white/40 tracking-wide">
            {currentIndex + 1} / {photos.length}
          </div>


          {/* Previous */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1)
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            aria-label={t.lightbox.previous}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14 4L8 10L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Image */}
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[90vw] h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 max-w-full max-h-full`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.imageUrl}
                alt={photo.description ? `${photo.title} - ${photo.description}` : `${photo.title} - Leon Wang 摄影作品`}
                className="max-w-full max-h-[85vh] object-contain"
                onLoad={() => setImageLoaded(true)}
              />
            </div>

            {/* Loading indicator */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}

            {/* Info bar */}
            {imageLoaded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-medium">{photo.title}</h3>
                </div>
                {photo.description && (
                  <p className="text-xs text-white/50 mt-1">{photo.description}</p>
                )}
                <div className="flex gap-4 mt-2 text-xs text-white/40">
                  {photo.focalLength && <span>{photo.focalLength}</span>}
                  {photo.aperture && <span>f/{photo.aperture}</span>}
                  {photo.iso && <span>ISO {photo.iso}</span>}
                  {photo.shutterSpeed && <span>{photo.shutterSpeed}s</span>}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0)
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            aria-label={t.lightbox.next}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 4L12 10L6 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div
            className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:bottom-6 sm:right-6"
            onClick={(e) => e.stopPropagation()}
          >
            {shareNotice && (
              <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-full bg-white/12 px-3 py-1.5 text-[11px] text-white/75 backdrop-blur-md">
                {shareNotice}
              </span>
            )}
            <a
              href={photo.originalUrl || photo.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center gap-2 rounded-full border border-accent/35 bg-black/45 px-3.5 text-accent backdrop-blur-md transition-all hover:border-accent/70 hover:bg-accent/12"
              aria-label={photo.originalUrl ? t.lightbox.viewOriginal : t.lightbox.viewHighRes}
              title={photo.originalUrl ? t.lightbox.viewOriginal : t.lightbox.viewHighRes}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              <span className="whitespace-nowrap text-xs">
                {photo.originalUrl ? t.lightbox.viewOriginal : t.lightbox.viewHighRes}
              </span>
            </a>
            <a
              href={`/api/photos/${photo.id}/download`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/65 backdrop-blur-md transition-all hover:border-accent/40 hover:text-accent"
              aria-label={photo.originalUrl ? t.lightbox.download : t.lightbox.downloadHighRes}
              title={photo.originalUrl ? t.lightbox.download : t.lightbox.downloadHighRes}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </a>
            <button
              type="button"
              onClick={handleLike}
              disabled={liking}
              className={`group flex h-11 items-center gap-2 rounded-full border px-3.5 backdrop-blur-md transition-all ${
                liked
                  ? 'border-red-400/45 bg-red-500/16 text-red-400'
                  : 'border-white/10 bg-white/8 text-white/65 hover:border-red-400/35 hover:text-red-400'
              }`}
              aria-label={liked ? t.lightbox.unlike : t.lightbox.like}
            >
              <motion.svg
                animate={liked ? { scale: [1, 1.28, 1] } : { scale: 1 }}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
              </motion.svg>
              <span className="text-xs tabular-nums">{likeCount}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/65 backdrop-blur-md transition-all hover:border-accent/40 hover:text-accent"
              aria-label={t.lightbox.share}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/65 backdrop-blur-md transition-all hover:border-white/25 hover:text-white"
              aria-label={t.lightbox.comments}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Comments side panel - fullscreen on mobile, side panel on desktop */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[101] bg-surface/95 backdrop-blur-xl flex flex-col sm:relative sm:inset-auto sm:w-[380px] sm:border-l sm:border-white/10 sm:bg-surface/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full sm:w-[380px] h-full flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    {t.lightbox.commentHeader.replace('{count}', String(comments.length))}
                  </h4>
                  <button
                    onClick={() => setShowComments(false)}
                    className="sm:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {/* Comment list */}
                <div
                  ref={commentListRef}
                  className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
                >
                  {commentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-white/20 text-center py-8">
                      {t.lightbox.noComments}
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border-b border-white/5 pb-3 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-medium">
                            {comment.nickname.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium">{comment.nickname}</span>
                          <span className="text-[10px] text-white/20 ml-auto">
                            {new Date(comment.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed ml-7">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment form */}
                <div className="px-5 py-4 border-t border-white/10">
                  {commentError && (
                    <p className="text-xs text-danger mb-2">{commentError}</p>
                  )}
                  <form onSubmit={handleSubmitComment} className="space-y-2">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={t.lightbox.nicknamePlaceholder}
                      maxLength={50}
                      className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t.lightbox.commentPlaceholder}
                        required
                        maxLength={500}
                        className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !content.trim()}
                        className="px-3 py-2 text-xs rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        {submitting ? (
                          <span className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                        ) : (
                          t.lightbox.send
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
