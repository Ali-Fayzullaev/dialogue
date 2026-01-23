'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send, Paperclip, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import { useStore } from '@/store/useStore'
import { Chat } from '@/lib/supabase'
import { formatTime, formatDate, isSameDay } from '@/lib/utils'

interface ChatAreaProps {
  chat: Chat | null
  onBack: () => void
}

export default function ChatArea({ chat, onBack }: ChatAreaProps) {
  const { user, getDisplayName, getInitials } = useAuth()
  const { loadMessages, sendMessage, markAsRead, subscribeToMessages } = useChats()
  // Берём messages напрямую из store для реактивности
  const messages = useStore((state) => state.messages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chat) {
      loadMessages(chat.id)
      markAsRead(chat.id)
      const unsubscribe = subscribeToMessages(chat.id)
      return unsubscribe
    }
  }, [chat, loadMessages, markAsRead, subscribeToMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chat || !input.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(chat.id, input)
      setInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="w-16 h-16 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Выберите чат</h3>
        <p className="text-gray-400">или начните новый разговор</p>
      </div>
    )
  }

  const chatName = chat.is_group ? chat.name : getDisplayName(chat.otherUser)
  const chatInitials = chat.is_group ? (chat.name?.[0] || 'Г') : getInitials(chat.otherUser)

  let lastDate: string | null = null

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-4">
        <button
          onClick={onBack}
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {chatInitials}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{chatName}</h3>
          <span className="text-sm text-green-500">В сети</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Нет сообщений. Начните разговор!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isSent = message.sender_id === user?.id
              const messageDate = formatDate(message.created_at)
              const showDateDivider = messageDate !== lastDate
              lastDate = messageDate

              return (
                <div key={message.id}>
                  {showDateDivider && (
                    <div className="flex justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-4 py-1 rounded-full">
                        {messageDate}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isSent ? 'order-1' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isSent
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {message.content}
                      </div>
                      <div
                        className={`text-xs text-gray-400 mt-1 ${
                          isSent ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex items-center gap-3">
        <button
          type="button"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишите сообщение..."
          className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-11 h-11 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
