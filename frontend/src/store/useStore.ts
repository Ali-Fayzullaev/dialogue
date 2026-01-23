import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Chat, Message } from '@/lib/supabase'

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
  
  // Messages
  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  
  // UI
  isMobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false, chats: [], messages: [], currentChat: null }),
      
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
      
      // Messages
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => {
        // Проверяем на дубликаты по id
        const exists = state.messages.some((m) => m.id === message.id)
        if (exists) {
          console.log('Message already exists, skipping:', message.id)
          return state
        }
        console.log('Adding new message to state:', message.id)
        return {
          messages: [...state.messages, message],
        }
      }),
      
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
