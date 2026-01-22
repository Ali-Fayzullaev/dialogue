'use client'

import { useCallback } from 'react'
import { supabase, User } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export function useAuth() {
  const { user, setUser, logout: storeLogout } = useStore()

  const verifyCode = useCallback(async (code: string): Promise<User> => {
    // Find the auth code
    const { data: authCodes, error: codeError } = await supabase
      .from('auth_codes')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .single()

    if (codeError || !authCodes) {
      throw new Error('Неверный код или код уже использован')
    }

    // Check expiration
    if (new Date(authCodes.expires_at) < new Date()) {
      throw new Error('Код истёк. Запросите новый код в боте.')
    }

    // Mark code as used
    await supabase
      .from('auth_codes')
      .update({ used: true })
      .eq('id', authCodes.id)

    // Find or create user
    let { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', authCodes.telegram_id)
      .single()

    if (existingUser) {
      // Update existing user
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          username: authCodes.telegram_username,
          first_name: authCodes.telegram_first_name,
          last_seen: new Date().toISOString(),
        })
        .eq('telegram_id', authCodes.telegram_id)
        .select()
        .single()

      setUser(updatedUser)
      return updatedUser
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          telegram_id: authCodes.telegram_id,
          username: authCodes.telegram_username,
          first_name: authCodes.telegram_first_name,
        })
        .select()
        .single()

      if (createError) throw createError

      setUser(newUser)
      return newUser
    }
  }, [setUser])

  const checkSession = useCallback(async () => {
    if (user) {
      // Update last_seen
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
      return user
    }
    return null
  }, [user])

  const logout = useCallback(async () => {
    if (user) {
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
    }
    storeLogout()
  }, [user, storeLogout])

  const getDisplayName = useCallback((u?: User | null) => {
    const target = u || user
    if (!target) return 'Пользователь'
    return target.first_name || (target.username ? `@${target.username}` : 'Пользователь')
  }, [user])

  const getInitials = useCallback((u?: User | null) => {
    const target = u || user
    if (!target) return '?'
    if (target.first_name) return target.first_name.charAt(0).toUpperCase()
    if (target.username) return target.username.charAt(0).toUpperCase()
    return '?'
  }, [user])

  return {
    user,
    isAuthenticated: !!user,
    verifyCode,
    checkSession,
    logout,
    getDisplayName,
    getInitials,
  }
}
