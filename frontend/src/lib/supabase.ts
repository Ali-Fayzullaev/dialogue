import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  created_at: string
  last_seen: string
}

export interface Chat {
  id: string
  name: string | null
  is_group: boolean
  created_at: string
  created_by: string
  members?: User[]
  otherUser?: User
  lastMessage?: Message
  unreadCount?: number
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  sender?: User
}

export interface AuthCode {
  id: string
  code: string
  telegram_id: number
  telegram_username: string | null
  telegram_first_name: string | null
  created_at: string
  expires_at: string
  used: boolean
}
