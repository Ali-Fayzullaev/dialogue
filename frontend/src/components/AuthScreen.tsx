'use client'

import { useState } from 'react'
import { MessageCircle, Send, Shield, Zap, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AuthScreenProps {
  onSuccess: () => void
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { verifyCode } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length !== 6) {
      setError('Введите 6-значный код')
      return
    }

    setLoading(true)
    setError('')

    try {
      await verifyCode(code)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-20 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Dialogue</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Общайся<br />
              <span className="text-white/80">безопасно</span>
            </h1>
            <p className="text-xl text-white/70 max-w-md">
              Современный мессенджер с авторизацией через Telegram. Никаких паролей, только безопасность.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <span>Безопасная авторизация через Telegram</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span>Мгновенная доставка сообщений</span>
            </div>
            <div className="flex items-center gap-4 text-white/90">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span>Приватные чаты без компромиссов</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/50 text-sm">
          © 2026 Dialogue. Все права защищены.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Добро пожаловать</h2>
            <p className="text-gray-400">Войдите с помощью Telegram бота</p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#12121a] border border-gray-800 rounded-2xl p-5 hover:border-violet-500/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-2">Откройте бота</h3>
                    <a
                      href="https://t.me/dialogue_messenger_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#2AABEE] hover:bg-[#229ED9] text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#2AABEE]/30"
                    >
                      <Send className="w-4 h-4" />
                      @dialogue_messenger_bot
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-[#12121a] border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Нажмите /start</h3>
                  <p className="text-gray-400 text-sm">Бот отправит вам 6-значный код для входа</p>
                </div>
              </div>
            </div>

            {/* Step 3 - Code Input */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-purple-600/10 rounded-2xl" />
              <div className="relative bg-[#12121a] border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-3">Введите код</h3>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="• • • • • •"
                          className="w-full px-5 py-4 bg-[#1a1a24] border border-gray-700 rounded-xl text-2xl font-mono text-white text-center tracking-[0.5em] placeholder-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                          maxLength={6}
                        />
                        {code.length === 6 && (
                          <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400 animate-pulse" />
                        )}
                      </div>
                      <button
                        type="submit"
                        disabled={loading || code.length !== 6}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Проверка...
                          </>
                        ) : (
                          <>
                            Войти в Dialogue
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>
                    {error && (
                      <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer for mobile */}
          <p className="text-center text-gray-500 text-sm lg:hidden">
            © 2026 Dialogue. Безопасный мессенджер.
          </p>
        </div>
      </div>
    </div>
  )
}
