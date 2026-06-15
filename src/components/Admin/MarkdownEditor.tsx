'use client'

import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  getToken: () => string | null
}

interface UploadedImage {
  url: string
}

const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g

const editorTools = [
  { label: 'H2', title: '二级标题', before: '## ', after: '', placeholder: '标题' },
  { label: 'B', title: '粗体', before: '**', after: '**', placeholder: '粗体文字' },
  { label: 'I', title: '斜体', before: '*', after: '*', placeholder: '斜体文字' },
  { label: '“', title: '引用', before: '> ', after: '', placeholder: '引用文字' },
  { label: '↗', title: '链接', before: '[', after: '](https://)', placeholder: '链接文字' },
  { label: '</>', title: '代码块', before: '```\n', after: '\n```', placeholder: '代码' },
]

export default function MarkdownEditor({ value, onChange, getToken }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [dragging, setDragging] = useState(false)

  const updateSelection = (before: string, after = '', placeholder = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const selectionStart = start + before.length
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length)
    })
  }

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const prefix = start > 0 && value[start - 1] !== '\n' ? '\n\n' : ''
    const suffix = end < value.length && value[end] !== '\n' ? '\n\n' : '\n'
    const insertion = `${prefix}${text}${suffix}`
    onChange(`${value.slice(0, start)}${insertion}${value.slice(end)}`)

    requestAnimationFrame(() => {
      textarea?.focus()
      const cursor = start + insertion.length
      textarea?.setSelectionRange(cursor, cursor)
    })
  }

  const uploadImages = async (files: File[]) => {
    const token = getToken()
    if (!token) throw new Error('登录已失效，请重新登录')
    const uploaded: UploadedImage[] = []

    for (let start = 0; start < files.length; start += 5) {
      const batch = files.slice(start, start + 5)
      const formData = new FormData()
      batch.forEach((file) => formData.append('files', file))
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || '图片上传失败')
      if (!Array.isArray(data.data) || data.data.length !== batch.length) {
        throw new Error('部分图片上传失败，请检查图片格式或文件大小')
      }
      uploaded.push(...data.data)
    }

    return uploaded
  }

  const uploadAndInsert = async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) return

    setUploading(true)
    setStatus(`正在上传 ${images.length} 张图片...`)
    try {
      const uploaded = await uploadImages(images)
      const markdown = uploaded
        .map((image, index) => `![${images[index]?.name.replace(/\.[^.]+$/, '') || '文章图片'}](${image.url})`)
        .join('\n\n')
      insertAtCursor(markdown)
      setStatus(`已插入 ${uploaded.length} 张图片`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '图片上传失败')
    } finally {
      setUploading(false)
    }
  }

  const importMarkdown = async (files: File[]) => {
    const markdownFile = files.find((file) => file.name.toLowerCase().endsWith('.md') || file.type === 'text/markdown')
    if (!markdownFile) {
      await uploadAndInsert(files)
      return
    }

    setUploading(true)
    setStatus('正在导入 Markdown...')
    try {
      let markdown = await markdownFile.text()
      const images = files.filter((file) => file !== markdownFile && file.type.startsWith('image/'))
      const references = [...markdown.matchAll(imagePattern)]
      const localReferences = references.filter((match) => !/^(https?:|data:|\/)/i.test(match[2]))
      let replacedCount = 0

      if (images.length > 0) {
        const uploaded = await uploadImages(images)
        const urlsByName = new Map<string, string>()
        images.forEach((file, index) => urlsByName.set(file.name.toLowerCase(), uploaded[index].url))

        markdown = markdown.replace(imagePattern, (full, alt: string, source: string) => {
          if (/^(https?:|data:|\/)/i.test(source)) return full
          let normalizedSource = source.split(/[?#]/)[0].replace(/\\/g, '/')
          try {
            normalizedSource = decodeURIComponent(normalizedSource)
          } catch {
            // Keep the original path when a Markdown reference contains malformed escapes.
          }
          const filename = normalizedSource.split('/').pop()?.toLowerCase()
          const uploadedUrl = filename ? urlsByName.get(filename) : undefined
          if (!uploadedUrl) return full
          replacedCount += 1
          return `![${alt}](${uploadedUrl})`
        })
      }

      onChange(markdown)
      const unresolved = Math.max(localReferences.length - replacedCount, 0)
      setStatus(
        unresolved > 0
          ? `Markdown 已导入，${replacedCount} 张图片已上传，仍有 ${unresolved} 个本地图片引用未匹配`
          : `Markdown 已导入${replacedCount > 0 ? `，并上传 ${replacedCount} 张图片` : ''}`
      )
      setMode('edit')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Markdown 导入失败')
    } finally {
      setUploading(false)
    }
  }

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const images = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) return
    event.preventDefault()
    await uploadAndInsert(images)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.some((file) => file.name.toLowerCase().endsWith('.md'))) {
      await importMarkdown(files)
    } else {
      await uploadAndInsert(files)
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-colors ${dragging ? 'border-accent bg-accent/5' : 'border-white/10'}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={handleDrop}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.025] p-2">
        {editorTools.map((tool) => (
          <button
            key={tool.title}
            type="button"
            title={tool.title}
            onClick={() => updateSelection(tool.before, tool.after, tool.placeholder)}
            disabled={uploading}
            className="flex h-8 min-w-8 items-center justify-center px-2 text-xs text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            {tool.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-white/10" />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          className="flex h-8 items-center gap-1.5 px-2 text-xs text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <span aria-hidden="true">▧</span>
          插入图片
        </button>
        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          disabled={uploading}
          className="flex h-8 items-center gap-1.5 px-2 text-xs text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <span aria-hidden="true">↑</span>
          导入 Markdown
        </button>
        <div className="ml-auto flex items-center gap-1">
          {(['edit', 'preview'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`h-8 px-3 text-xs transition-colors ${mode === item ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/65'}`}
            >
              {item === 'edit' ? '编辑' : '预览'}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void uploadAndInsert(Array.from(event.target.files || []))
          event.target.value = ''
        }}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".md,text/markdown,image/*"
        multiple
        hidden
        onChange={(event) => {
          void importMarkdown(Array.from(event.target.files || []))
          event.target.value = ''
        }}
      />

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={handlePaste}
          required
          className="min-h-[430px] w-full resize-y bg-transparent px-4 py-4 font-mono text-sm leading-7 text-white placeholder:text-white/20 focus:outline-none"
          placeholder={`# 标题\n\n正文内容...\n\n可直接粘贴、拖入或选择图片。`}
        />
      ) : (
        <div className="prose prose-invert min-h-[430px] max-w-none overflow-y-auto px-5 py-5 prose-img:rounded-sm prose-p:text-white/60 prose-a:text-accent">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-sm text-white/25">暂无可预览内容</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-[11px] text-white/30">
        <span>{dragging ? '松开即可上传图片或导入 Markdown' : status || '支持粘贴图片、拖入图片，以及同时选择 Markdown 与其本地图片'}</span>
        <span>{value.length.toLocaleString()} 字符</span>
      </div>
    </div>
  )
}
