import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Chat, Message } from '@/lib/supabase'

// Отдельный store для сообщений БЕЗ persist - для реактивности
interface MessagesState {
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  clearMessages: () => void
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  setMessages: (messages) => {
    console.log('📝 setMessages called:', messages.length)
    set({ messages })
  },
  addMessage: (message) => {
    const state = get()
    const exists = state.messages.some((m) => m.id === message.id)
    if (exists) {
      console.log('⚠️ Message already exists, skipping:', message.id)
      return
    }
    console.log('✅ Adding new message to state:', message.id)
    const newMessages = [...state.messages, message]
    console.log('📊 New messages count:', newMessages.length)
    set({ messages: newMessages })
  },
  clearMessages: () => set({ messages: [] }),
}))

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  
  // Chats
  chats: Chat[]
  currentChat: Chat | null
  setChats: (chats: Chat[]) => void
  setCurrentChat: (chat: Chat | null) => void
  updateChat: (chatId: string, updates: Partial<Chat>) => void
  
  // UI
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        set({ user: null, isAuthenticated: false, chats: [], currentChat: null })
        useMessagesStore.getState().clearMessages()
      },
      
      // Chats
      chats: [],
      currentChat: null,
      setChats: (chats) => set({ chats }),
      setCurrentChat: (currentChat) => set({ currentChat }),
      updateChat: (chatId, updates) => set((state) => ({
        chats: state.chats.map((chat) =>
          chat.id === chatId ? { ...chat, ...updates } : chat
        ),
      })),
      
      // UI
      isMobileMenuOpen: false,
      setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
    }),
    {
      name: 'dialogue-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
