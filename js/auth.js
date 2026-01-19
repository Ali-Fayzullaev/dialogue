// ========================================
// МОДУЛЬ АВТОРИЗАЦИИ
// ========================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'dialogue_session';
    }

    // Проверка существующей сессии
    async checkSession() {
        const session = this.getStoredSession();
        
        if (!session || !session.userId) {
            return null;
        }
        
        // Проверяем, не истекла ли сессия
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            this.clearSession();
            return null;
        }
        
        try {
            // Загружаем данные пользователя из БД
            const users = await supabase.query('users', {
                filters: { 'id': `eq.${session.userId}` }
            });
            
            if (users && users.length > 0) {
                this.currentUser = users[0];
                
                // Обновляем last_seen
                await supabase.update('users', 
                    { last_seen: new Date().toISOString() },
                    { 'id': `eq.${session.userId}` }
                );
                
                return this.currentUser;
            }
        } catch (error) {
            console.error('Session check failed:', error);
        }
        
        this.clearSession();
        return null;
    }

    // Верификация кода авторизации
    async verifyCode(code) {
        try {
            // Ищем код в базе
            const codes = await supabase.query('auth_codes', {
                filters: {
                    'code': `eq.${code}`,
                    'used': 'eq.false'
                }
            });
            
            if (!codes || codes.length === 0) {
                throw new Error('Неверный код или код уже использован');
            }
            
            const authCode = codes[0];
            
            // Проверяем срок действия
            if (new Date(authCode.expires_at) < new Date()) {
                throw new Error('Код истёк. Запросите новый код в боте.');
            }
            
            // Помечаем код как использованный
            await supabase.update('auth_codes',
                { used: true },
                { 'id': `eq.${authCode.id}` }
            );
            
            // Ищем или создаём пользователя
            let user = await this.findOrCreateUser(authCode);
            
            // Сохраняем сессию
            this.saveSession(user);
            this.currentUser = user;
            
            return user;
            
        } catch (error) {
            console.error('Verification failed:', error);
            throw error;
        }
    }

    // Поиск или создание пользователя
    async findOrCreateUser(authCode) {
        // Ищем существующего пользователя
        const existingUsers = await supabase.query('users', {
            filters: { 'telegram_id': `eq.${authCode.telegram_id}` }
        });
        
        if (existingUsers && existingUsers.length > 0) {
            // Обновляем данные
            const updated = await supabase.update('users', {
                username: authCode.telegram_username,
                first_name: authCode.telegram_first_name,
                last_seen: new Date().toISOString()
            }, {
                'telegram_id': `eq.${authCode.telegram_id}`
            });
            
            return updated[0];
        }
        
        // Создаём нового пользователя
        const newUsers = await supabase.insert('users', {
            telegram_id: authCode.telegram_id,
            username: authCode.telegram_username,
            first_name: authCode.telegram_first_name
        });
        
        return newUsers[0];
    }

    // Сохранение сессии
    saveSession(user) {
        const session = {
            userId: user.id,
            telegramId: user.telegram_id,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + CONFIG.SESSION_DURATION).toISOString()
        };
        
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    // Получение сохранённой сессии
    getStoredSession() {
        const data = localStorage.getItem(this.sessionKey);
        return data ? JSON.parse(data) : null;
    }

    // Очистка сессии
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
    }

    // Выход
    async logout() {
        if (this.currentUser) {
            try {
                await supabase.update('users',
                    { last_seen: new Date().toISOString() },
                    { 'id': `eq.${this.currentUser.id}` }
                );
            } catch (error) {
                console.error('Logout update failed:', error);
            }
        }
        
        this.clearSession();
        supabase.unsubscribeAll();
    }

    // Получение текущего пользователя
    getUser() {
        return this.currentUser;
    }

    // Получение инициалов
    getInitials(user = null) {
        const u = user || this.currentUser;
        if (!u) return '?';
        
        if (u.first_name) {
            return u.first_name.charAt(0).toUpperCase();
        }
        if (u.username) {
            return u.username.charAt(0).toUpperCase();
        }
        return '?';
    }

    // Получение отображаемого имени
    getDisplayName(user = null) {
        const u = user || this.currentUser;
        if (!u) return 'Пользователь';
        
        if (u.first_name) {
            return u.first_name;
        }
        if (u.username) {
            return `@${u.username}`;
        }
        return 'Пользователь';
    }
}

// Глобальный экземпляр менеджера авторизации
const auth = new AuthManager();
