'use client'

import { useCallback, useEffect, useRef } from 'react'
import { supabase, Chat, Message, User } from '@/lib/supabase'
import { useStore, useMessagesStore } from '@/store/useStore'
import { useAuth } from './useAuth'

// Глобальная переменная для подписки (чтобы не пересоздавалась при каждом вызове хука)
let globalSubscription: ReturnType<typeof supabase.channel> | null = null
let currentSubscribedChatId: string | null = null

export function useChats() {
  const { user } = useAuth()
  const { chats, currentChat, setChats, setCurrentChat, updateChat } = useStore()
  const { messages, setMessages, addMessage } = useMessagesStore()

  const loadChats = useCallback(async () => {
    if (!user) return []

    // Get chat memberships
    const { data: memberships } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', user.id)

    if (!memberships || memberships.length === 0) {
      setChats([])
      return []
    }

    const chatIds = memberships.map((m) => m.chat_id)

    // Get chats
    const { data: chatsData } = await supabase
      .from('chats')
      .select('*')
      .in('id', chatIds)
      .order('created_at', { ascending: false })

    if (!chatsData) {
      setChats([])
      return []
    }

    // Enrich chats with members and last message
    const enrichedChats: Chat[] = await Promise.all(
      chatsData.map(async (chat) => {
        // Get members
        const { data: members } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', chat.id)

        const memberIds = members?.map((m) => m.user_id) || []

        const { data: users } = await supabase
          .from('users')
          .select('*')
          .in('id', memberIds)

        const otherUser = users?.find((u) => u.id !== user.id)

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)

        // Count unread
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', user.id)
          .eq('is_read', false)

        return {
          ...chat,
          members: users || [],
          otherUser,
          lastMessage: lastMessages?.[0],
          unreadCount: unreadCount || 0,
        }
      })
    )

    // Sort by last message
    enrichedChats.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime()
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime()
      return bTime - aTime
    })

    setChats(enrichedChats)
    return enrichedChats
  }, [user, setChats])

  const createChat = useCallback(async (otherUserId: string): Promise<Chat> => {
    if (!user) throw new Error('Not authenticated')

    // Check if chat already exists
    const existingChat = chats.find(
      (chat) => !chat.is_group && chat.otherUser?.id === otherUserId
    )

    if (existingChat) return existingChat

    // Create new chat
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({ is_group: false, created_by: user.id })
      .select()
      .single()

    if (error) throw error

    // Add members
    await supabase.from('chat_members').insert([
      { chat_id: newChat.id, user_id: user.id },
      { chat_id: newChat.id, user_id: otherUserId },
    ])

    await loadChats()

    return chats.find((c) => c.id === newChat.id) || newChat
  }, [user, chats, loadChats])

  const loadMessages = useCallback(async (chatId: string) => {
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (!messagesData) {
      setMessages([])
      return []
    }

    // Get senders
    const senderIds = [...new Set(messagesData.map((m) => m.sender_id))]
    const { data: senders } = await supabase
      .from('users')
      .select('*')
      .in('id', senderIds)

    const sendersMap: Record<string, User> = {}
    senders?.forEach((s) => (sendersMap[s.id] = s))

    const enrichedMessages = messagesData.map((m) => ({
      ...m,
      sender: sendersMap[m.sender_id],
    }))

    setMessages(enrichedMessages)
    return enrichedMessages
  }, [setMessages])

  const sendMessage = useCallback(async (chatId: string, content: string) => {
    if (!user || !content.trim()) return null

    console.log('📤 Sending message...')

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error sending message:', error)
      throw error
    }

    console.log('📨 Message sent, adding to store:', newMessage?.id)

    // Сразу добавляем сообщение в локальный стейт напрямую
    if (newMessage) {
      useMessagesStore.getState().addMessage({
        ...newMessage,
        sender: user,
      })
    }

    return newMessage
  }, [user])

  const markAsRead = useCallback(async (chatId: string) => {
    if (!user) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    updateChat(chatId, { unreadCount: 0 })
  }, [user, updateChat])

  const subscribeToMessages = useCallback((chatId: string) => {
    // Если уже подписаны на этот чат - не переподписываемся
    if (currentSubscribedChatId === chatId && globalSubscription) {
      console.log('Already subscribed to chat:', chatId)
      return () => {}
    }

    console.log('Setting up realtime subscription for chat:', chatId)
    
    // Unsubscribe from previous
    if (globalSubscription) {
      console.log('Removing previous subscription')
      supabase.removeChannel(globalSubscription)
      globalSubscription = null
      currentSubscribedChatId = null
    }

    const channelName = `messages-${chatId}-${Date.now()}`
    console.log('Creating channel:', channelName)

    // Получаем addMessage из messages store напрямую
    const storeAddMessage = useMessagesStore.getState().addMessage

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log('Realtime event received:', payload.eventType, payload)
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message

            // Get sender
            const { data: sender } = await supabase
              .from('users')
              .select('*')
              .eq('id', newMessage.sender_id)
              .single()

            console.log('Calling addMessage with:', newMessage.id)
            storeAddMessage({ ...newMessage, sender })
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Realtime subscription status:', status)
        if (err) {
          console.error('Realtime subscription error:', err)
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime messages!')
          currentSubscribedChatId = chatId
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check Supabase Realtime settings')
        }
        if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out')
        }
      })

    globalSubscription = channel

    return () => {
      console.log('Cleaning up subscription')
      if (globalSubscription) {
        supabase.removeChannel(globalSubscription)
        globalSubscription = null
        currentSubscribedChatId = null
      }
    }
  }, [])

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!user) return []

    let queryBuilder = supabase
      .from('users')
      .select('*')
      .neq('id', user.id)
      .limit(20)

    if (query) {
      queryBuilder = queryBuilder.or(`username.ilike.%${query}%,first_name.ilike.%${query}%`)
    }

    const { data } = await queryBuilder.order('created_at', { ascending: false })
    return data || []
  }, [user])

  // Cleanup on unmount - теперь не нужен, т.к. используем глобальные переменные

  return {
    chats,
    currentChat,
    messages,
    setCurrentChat,
    loadChats,
    createChat,
    loadMessages,
    sendMessage,
    markAsRead,
    subscribeToMessages,
    searchUsers,
  }
}
