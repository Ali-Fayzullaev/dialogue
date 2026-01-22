'use client'

import { useEffect, useState } from 'react'
import { X, Search, MessageCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import { User } from '@/lib/supabase'

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onUserSelect: (userId: string) => void
}

export default function NewChatModal({ isOpen, onClose, onUserSelect }: NewChatModalProps) {
  const { getDisplayName, getInitials } = useAuth()
  const { searchUsers } = useChats()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadUsers = async (query = '') => {
    setLoading(true)
    try {
      const results = await searchUsers(query)
      setUsers(results)
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Новый чат</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск пользователей..."
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <MessageCircle className="w-10 h-10 mb-2 opacity-50" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            <div className="p-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onUserSelect(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(user)}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">
                      {getDisplayName(user)}
                    </div>
                    {user.username && (
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
