// ========================================
// КОНФИГУРАЦИЯ DIALOGUE MESSENGER
// ========================================

// ВАЖНО: Замени эти значения на свои из Supabase Dashboard
// Settings -> API -> Project URL и anon public key

const CONFIG = {
    // Supabase настройки
    SUPABASE_URL: 'https://cuasxzomsggjntyelnrt.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1YXN4em9tc2dnam50eWVsbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MDI2MzIsImV4cCI6MjA4NDM3ODYzMn0.u0Wu3JKHJSWBiIENkdUIFWLc8G7N_9_5orrNhXHn8AQ',
    
    // Telegram бот
    TELEGRAM_BOT: '@dialogue_messenger_bot',
    TELEGRAM_BOT_URL: 'https://t.me/dialogue_messenger_bot',
    
    // Настройки приложения
    APP_NAME: 'Dialogue',
    MESSAGE_FETCH_LIMIT: 50,
    
    // Время жизни сессии (в миллисекундах)
    SESSION_DURATION: 7 * 24 * 60 * 60 * 1000  // 7 дней
};

// Не изменяйте ничего ниже этой линии
Object.freeze(CONFIG);
