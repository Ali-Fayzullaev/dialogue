'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useChats } from '@/hooks/useChats'
import AuthScreen from '@/components/AuthScreen'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import NewChatModal from '@/components/NewChatModal'
import { Chat } from '@/lib/supabase'

export default function Home() {
  const { isAuthenticated, checkSession } = useAuth()
  const { currentChat, setCurrentChat, createChat, loadChats } = useChats()
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const [isMobileChat, setIsMobileChat] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkSession()
  }, [checkSession])

  const handleChatSelect = (chat: Chat) => {
    setCurrentChat(chat)
    setIsMobileChat(true)
  }

  const handleBack = () => {
    setIsMobileChat(false)
    setCurrentChat(null)
  }

  const handleNewChat = () => {
    setIsNewChatOpen(true)
  }

  const handleUserSelect = async (userId: string) => {
    try {
      const chat = await createChat(userId)
      setIsNewChatOpen(false)
      setCurrentChat(chat)
      setIsMobileChat(true)
      await loadChats()
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleAuthSuccess = () => {
    loadChats()
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={handleAuthSuccess} />
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar - hidden on mobile when chat is open */}
      <div className={`${isMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto`}>
        <Sidebar onChatSelect={handleChatSelect} onNewChat={handleNewChat} />
      </div>

      {/* Chat Area - hidden on mobile when no chat is selected */}
      <div className={`${!isMobileChat ? 'hidden md:flex' : 'flex'} flex-1`}>
        <ChatArea chat={currentChat} onBack={handleBack} />
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onUserSelect={handleUserSelect}
      />
    </div>
  )
}
