# 📱 Dialogue Messenger - Инструкция по настройке

## Структура проекта

```
dialogue/
├── index.html              # Главная страница
├── css/
│   └── style.css          # Стили
├── js/
│   ├── config.js          # Конфигурация (⚠️ НУЖНО НАСТРОИТЬ)
│   ├── supabase-client.js # Клиент Supabase
│   ├── auth.js            # Авторизация
│   ├── chat.js            # Чаты и сообщения
│   └── app.js             # Главный модуль
└── supabase-functions/
    └── telegram-bot.ts    # Код Edge Function
```

---

## 🔧 Шаг 1: Настройка базы данных Supabase

### 1.1 Создание таблиц

Перейди в **Supabase Dashboard** → **SQL Editor** → **New query**

Выполни SQL код:

```sql
-- Таблица пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица чатов
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Участники чатов
CREATE TABLE chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Сообщения
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Коды авторизации
CREATE TABLE auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  telegram_id BIGINT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN DEFAULT FALSE
);

-- Индексы
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_auth_codes_code ON auth_codes(code);
```

### 1.2 Настройка Row Level Security (RLS)

Выполни в SQL Editor:

```sql
-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;

-- Политики (для разработки - открытые)
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for chat_members" ON chat_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth_codes" ON auth_codes FOR ALL USING (true) WITH CHECK (true);
```

### 1.3 Включение Realtime

1. Перейди в **Database** → **Replication**
2. Нажми на таблицу `messages` и включи realtime
3. Повтори для `chats` и `chat_members`

---

## 🔧 Шаг 2: Создание Edge Function для Telegram бота

### 2.1 Установка Supabase CLI

Открой терминал и выполни:

```bash
npm install -g supabase
```

### 2.2 Инициализация проекта

```bash
cd c:\Users\Raycon\Documents\my-project\dialogue
supabase init
supabase login
supabase link --project-ref ВАШ_PROJECT_ID
```

> **PROJECT_ID** находится в URL: `https://supabase.com/dashboard/project/ВАШ_PROJECT_ID`

### 2.3 Создание функции

```bash
supabase functions new telegram-bot
```

Замени содержимое файла `supabase/functions/telegram-bot/index.ts` на код из `supabase-functions/telegram-bot.ts`

### 2.4 Деплой функции

```bash
supabase functions deploy telegram-bot --no-verify-jwt
```

### 2.5 Установка Webhook для Telegram

После деплоя выполни в терминале (замени URL на свой):

```bash
curl "https://api.telegram.org/bot8454018089:AAHVMbVAvZrOzOq9BSS1PiaOcmrRGF6VUKQ/setWebhook?url=https://ВАШ_PROJECT_ID.supabase.co/functions/v1/telegram-bot"
```

---

## 🔧 Шаг 3: Настройка конфигурации приложения

Открой файл `js/config.js` и замени:

```javascript
const CONFIG = {
    SUPABASE_URL: 'https://ВАШ_PROJECT_ID.supabase.co',
    SUPABASE_ANON_KEY: 'ВАШ_ANON_KEY',
    // ... остальное оставь без изменений
};
```

**Где найти ключи:**
1. Перейди в Supabase Dashboard → **Settings** → **API**
2. Скопируй **Project URL** 
3. Скопируй **anon public** key (в секции Project API keys)

---

## 🚀 Шаг 4: Запуск приложения

### Вариант 1: Live Server (VS Code)
1. Установи расширение "Live Server"
2. Правый клик на `index.html` → "Open with Live Server"

### Вариант 2: Простой HTTP сервер
```bash
cd c:\Users\Raycon\Documents\my-project\dialogue
npx serve .
```

Или с Python:
```bash
python -m http.server 8000
```

---

## 📱 Как использовать

1. Открой приложение в браузере
2. Перейди по ссылке к боту `@dialogue_messenger_bot`
3. Нажми `/start` в боте
4. Получи 6-значный код
5. Введи код в приложении
6. Готово! Можешь начинать общение

---

## 🔒 Важная информация

- **Токен бота уже вшит в код** - для безопасности рекомендуется хранить его в environment variables
- **RLS политики открытые** - для продакшена нужно настроить более строгие правила
- **Код действителен 10 минут** - после этого нужно запросить новый

---

## ❓ Возможные проблемы

### "Неверный код"
- Проверь, что код не истёк (10 минут)
- Проверь, что таблица `auth_codes` создана
- Проверь подключение к Supabase

### Бот не отвечает
- Проверь, что webhook установлен
- Проверь логи Edge Function в Supabase Dashboard

### Нет чатов
- Нужно минимум 2 зарегистрированных пользователя
- Попроси друга авторизоваться через бота
