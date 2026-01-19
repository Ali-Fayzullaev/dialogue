// ========================================
// TELEGRAM BOT - SUPABASE EDGE FUNCTION
// ========================================
// Файл: supabase/functions/telegram-bot/index.ts
//
// Этот код нужно развернуть в Supabase Edge Functions
// Инструкция ниже

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = '8454018089:AAHVMbVAvZrOzOq9BSS1PiaOcmrRGF6VUKQ'

// Замените на ваши данные
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Генерация 6-значного кода
function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// Отправка сообщения в Telegram
async function sendTelegramMessage(chatId: number, text: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    })
}

// Обработка команды /start
async function handleStart(message: any) {
    const chatId = message.chat.id
    const user = message.from
    
    // Генерируем код
    const code = generateCode()
    
    // Сохраняем код в базу
    const { error } = await supabase
        .from('auth_codes')
        .insert({
            code: code,
            telegram_id: user.id,
            telegram_username: user.username || null,
            telegram_first_name: user.first_name || null
        })
    
    if (error) {
        console.error('Error saving code:', error)
        await sendTelegramMessage(chatId, '❌ Ошибка. Попробуйте ещё раз.')
        return
    }
    
    // Отправляем код пользователю
    const text = `🔐 <b>Ваш код для входа в Dialogue:</b>

<code>${code}</code>

⏱ Код действителен 10 минут.

Введите этот код на странице входа в мессенджер.`
    
    await sendTelegramMessage(chatId, text)
}

// Обработка входящего вебхука
async function handleWebhook(request: Request): Promise<Response> {
    try {
        const body = await request.json()
        
        // Проверяем наличие сообщения
        if (!body.message) {
            return new Response('OK', { status: 200 })
        }
        
        const message = body.message
        const text = message.text || ''
        
        // Обрабатываем команды
        if (text === '/start') {
            await handleStart(message)
        } else if (text === '/code' || text === '/login') {
            await handleStart(message)
        } else if (text === '/help') {
            await sendTelegramMessage(message.chat.id, `📱 <b>Dialogue Messenger</b>

Доступные команды:
/start - Получить код для входа
/code - Получить новый код
/help - Показать справку

🌐 Для использования мессенджера откройте веб-приложение и введите полученный код.`)
        } else {
            // Неизвестная команда
            await sendTelegramMessage(message.chat.id, `👋 Привет! Используйте /start чтобы получить код для входа в Dialogue.`)
        }
        
        return new Response('OK', { status: 200 })
        
    } catch (error) {
        console.error('Webhook error:', error)
        return new Response('Error', { status: 500 })
    }
}

// Основной обработчик
serve(async (request: Request) => {
    // CORS заголовки
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        })
    }
    
    if (request.method === 'POST') {
        return await handleWebhook(request)
    }
    
    return new Response('Dialogue Bot is running!', { status: 200 })
})
