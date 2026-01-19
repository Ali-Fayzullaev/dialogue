// ========================================
// МОДУЛЬ ЧАТОВ И СООБЩЕНИЙ
// ========================================

class ChatManager {
    constructor() {
        this.chats = [];
        this.currentChat = null;
        this.messages = [];
        this.messageSubscription = null;
    }

    // ===== ЗАГРУЗКА ЧАТОВ =====
    
    async loadChats() {
        const user = auth.getUser();
        if (!user) return [];
        
        try {
            // Получаем все chat_members для текущего пользователя
            const memberships = await supabase.query('chat_members', {
                select: 'chat_id',
                filters: { 'user_id': `eq.${user.id}` }
            });
            
            if (!memberships || memberships.length === 0) {
                this.chats = [];
                return [];
            }
            
            const chatIds = memberships.map(m => m.chat_id);
            
            // Загружаем чаты
            const chats = await supabase.query('chats', {
                filters: { 'id': `in.(${chatIds.join(',')})` },
                order: 'created_at.desc'
            });
            
            // Для каждого чата загружаем участников и последнее сообщение
            for (const chat of chats) {
                // Получаем участников
                const members = await supabase.query('chat_members', {
                    select: 'user_id',
                    filters: { 'chat_id': `eq.${chat.id}` }
                });
                
                const memberIds = members.map(m => m.user_id);
                
                // Загружаем данные пользователей
                const users = await supabase.query('users', {
                    filters: { 'id': `in.(${memberIds.join(',')})` }
                });
                
                chat.members = users;
                
                // Получаем другого участника (для личного чата)
                chat.otherUser = users.find(u => u.id !== user.id);
                
                // Получаем последнее сообщение
                const lastMessages = await supabase.query('messages', {
                    filters: { 'chat_id': `eq.${chat.id}` },
                    order: 'created_at.desc',
                    limit: 1
                });
                
                chat.lastMessage = lastMessages[0] || null;
                
                // Считаем непрочитанные
                const unread = await supabase.query('messages', {
                    select: 'id',
                    filters: {
                        'chat_id': `eq.${chat.id}`,
                        'sender_id': `neq.${user.id}`,
                        'is_read': 'eq.false'
                    }
                });
                
                chat.unreadCount = unread ? unread.length : 0;
            }
            
            // Сортируем по последнему сообщению
            chats.sort((a, b) => {
                const aTime = a.lastMessage ? new Date(a.lastMessage.created_at) : new Date(a.created_at);
                const bTime = b.lastMessage ? new Date(b.lastMessage.created_at) : new Date(b.created_at);
                return bTime - aTime;
            });
            
            this.chats = chats;
            return chats;
            
        } catch (error) {
            console.error('Failed to load chats:', error);
            return [];
        }
    }

    // ===== СОЗДАНИЕ ЧАТА =====
    
    async createChat(otherUserId) {
        const user = auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        // Проверяем, нет ли уже чата с этим пользователем
        const existingChat = this.chats.find(chat => 
            !chat.is_group && 
            chat.otherUser && 
            chat.otherUser.id === otherUserId
        );
        
        if (existingChat) {
            return existingChat;
        }
        
        try {
            // Создаём новый чат
            const newChats = await supabase.insert('chats', {
                is_group: false,
                created_by: user.id
            });
            
            const chat = newChats[0];
            
            // Добавляем участников
            await supabase.insert('chat_members', {
                chat_id: chat.id,
                user_id: user.id
            });
            
            await supabase.insert('chat_members', {
                chat_id: chat.id,
                user_id: otherUserId
            });
            
            // Перезагружаем чаты
            await this.loadChats();
            
            return this.chats.find(c => c.id === chat.id);
            
        } catch (error) {
            console.error('Failed to create chat:', error);
            throw error;
        }
    }

    // ===== ЗАГРУЗКА СООБЩЕНИЙ =====
    
    async loadMessages(chatId) {
        try {
            const messages = await supabase.query('messages', {
                filters: { 'chat_id': `eq.${chatId}` },
                order: 'created_at.asc',
                limit: CONFIG.MESSAGE_FETCH_LIMIT
            });
            
            // Загружаем данные отправителей
            const senderIds = [...new Set(messages.map(m => m.sender_id))];
            
            if (senderIds.length > 0) {
                const senders = await supabase.query('users', {
                    filters: { 'id': `in.(${senderIds.join(',')})` }
                });
                
                const sendersMap = {};
                senders.forEach(s => sendersMap[s.id] = s);
                
                messages.forEach(m => {
                    m.sender = sendersMap[m.sender_id];
                });
            }
            
            this.messages = messages;
            return messages;
            
        } catch (error) {
            console.error('Failed to load messages:', error);
            return [];
        }
    }

    // ===== ОТПРАВКА СООБЩЕНИЯ =====
    
    async sendMessage(chatId, content) {
        const user = auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        if (!content.trim()) return null;
        
        try {
            const newMessages = await supabase.insert('messages', {
                chat_id: chatId,
                sender_id: user.id,
                content: content.trim()
            });
            
            return newMessages[0];
            
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    // ===== ОТМЕТКА КАК ПРОЧИТАННОЕ =====
    
    async markAsRead(chatId) {
        const user = auth.getUser();
        if (!user) return;
        
        try {
            await supabase.update('messages',
                { is_read: true },
                {
                    'chat_id': `eq.${chatId}`,
                    'sender_id': `neq.${user.id}`,
                    'is_read': 'eq.false'
                }
            );
            
            // Обновляем счётчик в локальном чате
            const chat = this.chats.find(c => c.id === chatId);
            if (chat) {
                chat.unreadCount = 0;
            }
            
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    // ===== ПОДПИСКА НА СООБЩЕНИЯ =====
    
    subscribeToMessages(chatId, callback) {
        // Отписываемся от предыдущей подписки
        if (this.messageSubscription) {
            supabase.unsubscribe(this.messageSubscription);
        }
        
        this.messageSubscription = supabase.subscribe(
            'messages',
            async (event) => {
                if (event.data.chat_id === chatId) {
                    // Загружаем данные отправителя
                    if (event.data.sender_id) {
                        const senders = await supabase.query('users', {
                            filters: { 'id': `eq.${event.data.sender_id}` }
                        });
                        event.data.sender = senders[0];
                    }
                    callback(event);
                }
            },
            `chat_id=eq.${chatId}`
        );
    }

    // ===== ПОИСК ПОЛЬЗОВАТЕЛЕЙ =====
    
    async searchUsers(query) {
        const user = auth.getUser();
        if (!user) return [];
        
        try {
            let users;
            
            if (query) {
                // Поиск по username или имени
                users = await supabase.query('users', {
                    filters: {
                        'or': `(username.ilike.%${query}%,first_name.ilike.%${query}%)`,
                        'id': `neq.${user.id}`
                    },
                    limit: 20
                });
            } else {
                // Получаем всех пользователей (кроме себя)
                users = await supabase.query('users', {
                    filters: { 'id': `neq.${user.id}` },
                    order: 'created_at.desc',
                    limit: 20
                });
            }
            
            return users || [];
            
        } catch (error) {
            console.error('Failed to search users:', error);
            return [];
        }
    }

    // ===== УТИЛИТЫ =====
    
    setCurrentChat(chat) {
        this.currentChat = chat;
    }

    getCurrentChat() {
        return this.currentChat;
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        
        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
        
        const time = date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        if (isToday) {
            return time;
        } else if (isYesterday) {
            return 'Вчера';
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    formatMessageTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Глобальный экземпляр менеджера чатов
const chatManager = new ChatManager();
