'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, LogOut, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import { Chat } from '@/lib/supabase'
import { formatDistanceToNow } from '@/lib/utils'

interface SidebarProps {
  onChatSelect: (chat: Chat) => void
  onNewChat: () => void
}

export default function Sidebar({ onChatSelect, onNewChat }: SidebarProps) {
  const { user, logout, getDisplayName, getInitials } = useAuth()
  const { chats, currentChat, loadChats } = useChats()
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadChats()
  }, [loadChats])

  const filteredChats = chats.filter((chat) => {
    const name = chat.is_group 
      ? chat.name 
      : getDisplayName(chat.otherUser)
    return name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dialogue
          </h1>
          <button
            onClick={onNewChat}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-indigo-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-center">Нет чатов.<br />Начните новый разговор!</p>
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.map((chat) => {
              const name = chat.is_group 
                ? chat.name 
                : getDisplayName(chat.otherUser)
              const initials = chat.is_group
                ? (chat.name?.[0] || 'Г')
                : getInitials(chat.otherUser)
              const isActive = currentChat?.id === chat.id

              return (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 truncate">
                        {name}
                      </span>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatDistanceToNow(chat.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 truncate">
                        {chat.lastMessage?.content || 'Нет сообщений'}
                      </span>
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* User Panel */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {getInitials()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 truncate">
            {getDisplayName()}
          </div>
          <div className="text-xs text-green-500">В сети</div>
        </div>
        <button
          onClick={logout}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
