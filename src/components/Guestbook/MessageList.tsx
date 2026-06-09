'use client'

import MessageCard from './MessageCard'
import { useLanguage } from '@/i18n/useLanguage'
import type { MessageType } from '@/types'

interface MessageListProps {
  messages: MessageType[]
}

export default function MessageList({ messages }: MessageListProps) {
  const { t } = useLanguage()

  if (!messages.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-white/30 text-sm">{t.guestbook.empty}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {messages.map((msg, i) => (
        <MessageCard key={msg.id} message={msg} index={i} />
      ))}
    </div>
  )
}
