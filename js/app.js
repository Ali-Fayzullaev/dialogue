// ========================================
// ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ
// ========================================

class App {
    constructor() {
        this.elements = {};
        this.init();
    }

    async init() {
        this.cacheElements();
        this.bindEvents();
        
        // Проверяем сессию
        const user = await auth.checkSession();
        
        if (user) {
            this.showMainScreen();
            await this.loadUserData();
        } else {
            this.showAuthScreen();
        }
    }

    // Кэширование DOM элементов
    cacheElements() {
        this.elements = {
            // Экраны
            authScreen: document.getElementById('auth-screen'),
            mainScreen: document.getElementById('main-screen'),
            
            // Авторизация
            authCode: document.getElementById('auth-code'),
            verifyBtn: document.getElementById('verify-btn'),
            authError: document.getElementById('auth-error'),
            
            // Sidebar
            chatsList: document.getElementById('chats-list'),
            searchInput: document.getElementById('search-input'),
            newChatBtn: document.getElementById('new-chat-btn'),
            userAvatar: document.getElementById('user-avatar'),
            userInitials: document.getElementById('user-initials'),
            userName: document.getElementById('user-name'),
            logoutBtn: document.getElementById('logout-btn'),
            
            // Чат
            noChatSelected: document.getElementById('no-chat-selected'),
            chatContainer: document.getElementById('chat-container'),
            chatHeader: document.getElementById('chat-header'),
            chatAvatar: document.getElementById('chat-avatar'),
            chatInitials: document.getElementById('chat-initials'),
            chatName: document.getElementById('chat-name'),
            chatStatus: document.getElementById('chat-status'),
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            backBtn: document.getElementById('back-btn'),
            
            // Модальное окно
            newChatModal: document.getElementById('new-chat-modal'),
            closeModal: document.getElementById('close-modal'),
            searchUsers: document.getElementById('search-users'),
            usersList: document.getElementById('users-list')
        };
    }

    // Привязка событий
    bindEvents() {
        // Авторизация
        this.elements.verifyBtn.addEventListener('click', () => this.handleVerify());
        this.elements.authCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleVerify();
        });
        this.elements.authCode.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
        
        // Выход
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Новый чат
        this.elements.newChatBtn.addEventListener('click', () => this.openNewChatModal());
        this.elements.closeModal.addEventListener('click', () => this.closeNewChatModal());
        this.elements.newChatModal.addEventListener('click', (e) => {
            if (e.target === this.elements.newChatModal) this.closeNewChatModal();
        });
        this.elements.searchUsers.addEventListener('input', (e) => this.handleSearchUsers(e.target.value));
        
        // Отправка сообщения
        this.elements.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });
        
        // Мобильная навигация
        this.elements.backBtn.addEventListener('click', () => this.closeChatMobile());
        
        // Поиск чатов
        this.elements.searchInput.addEventListener('input', (e) => this.filterChats(e.target.value));
    }

    // ===== ЭКРАНЫ =====
    
    showAuthScreen() {
        this.elements.authScreen.classList.add('active');
        this.elements.mainScreen.classList.remove('active');
    }

    showMainScreen() {
        this.elements.authScreen.classList.remove('active');
        this.elements.mainScreen.classList.add('active');
    }

    // ===== АВТОРИЗАЦИЯ =====
    
    async handleVerify() {
        const code = this.elements.authCode.value.trim();
        
        if (code.length !== 6) {
            this.showAuthError('Введите 6-значный код');
            return;
        }
        
        this.elements.verifyBtn.disabled = true;
        this.elements.verifyBtn.textContent = 'Проверка...';
        this.showAuthError('');
        
        try {
            await auth.verifyCode(code);
            this.showMainScreen();
            await this.loadUserData();
        } catch (error) {
            this.showAuthError(error.message);
        } finally {
            this.elements.verifyBtn.disabled = false;
            this.elements.verifyBtn.textContent = 'Войти';
        }
    }

    showAuthError(message) {
        this.elements.authError.textContent = message;
    }

    async handleLogout() {
        await auth.logout();
        this.elements.authCode.value = '';
        this.elements.chatsList.innerHTML = '';
        this.elements.messagesContainer.innerHTML = '';
        this.showNoChatSelected();
        this.showAuthScreen();
    }

    // ===== ЗАГРУЗКА ДАННЫХ =====
    
    async loadUserData() {
        const user = auth.getUser();
        
        // Обновляем UI пользователя
        this.elements.userInitials.textContent = auth.getInitials();
        this.elements.userName.textContent = auth.getDisplayName();
        
        // Загружаем чаты
        await this.loadChats();
    }

    async loadChats() {
        const chats = await chatManager.loadChats();
        this.renderChats(chats);
    }

    // ===== РЕНДЕРИНГ ЧАТОВ =====
    
    renderChats(chats) {
        this.elements.chatsList.innerHTML = '';
        
        if (chats.length === 0) {
            this.elements.chatsList.innerHTML = `
                <div class="no-chats">
                    <p style="text-align: center; color: var(--text-muted); padding: 40px 20px;">
                        Нет чатов.<br>Начните новый разговор!
                    </p>
                </div>
            `;
            return;
        }
        
        chats.forEach(chat => {
            const chatEl = this.createChatElement(chat);
            this.elements.chatsList.appendChild(chatEl);
        });
    }

    createChatElement(chat) {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.dataset.chatId = chat.id;
        
        const otherUser = chat.otherUser;
        const name = chat.is_group ? chat.name : (otherUser ? auth.getDisplayName(otherUser) : 'Чат');
        const initials = chat.is_group ? (chat.name ? chat.name[0] : 'Г') : (otherUser ? auth.getInitials(otherUser) : '?');
        const preview = chat.lastMessage ? chat.lastMessage.content : 'Нет сообщений';
        const time = chat.lastMessage ? chatManager.formatTime(chat.lastMessage.created_at) : '';
        
        div.innerHTML = `
            <div class="chat-item-avatar">${initials}</div>
            <div class="chat-item-content">
                <div class="chat-item-header">
                    <span class="chat-item-name">${this.escapeHtml(name)}</span>
                    <span class="chat-item-time">${time}</span>
                </div>
                <div class="chat-item-preview">
                    ${this.escapeHtml(preview.substring(0, 40))}${preview.length > 40 ? '...' : ''}
                    ${chat.unreadCount > 0 ? `<span class="chat-item-unread">${chat.unreadCount}</span>` : ''}
                </div>
            </div>
        `;
        
        div.addEventListener('click', () => this.openChat(chat));
        
        return div;
    }

    filterChats(query) {
        const items = this.elements.chatsList.querySelectorAll('.chat-item');
        
        items.forEach(item => {
            const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
            const matches = name.includes(query.toLowerCase());
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    // ===== ОТКРЫТИЕ ЧАТА =====
    
    async openChat(chat) {
        // Отмечаем активный чат
        document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`[data-chat-id="${chat.id}"]`)?.classList.add('active');
        
        chatManager.setCurrentChat(chat);
        
        // Показываем контейнер чата
        this.elements.noChatSelected.style.display = 'none';
        this.elements.chatContainer.style.display = 'flex';
        
        // Обновляем заголовок
        const otherUser = chat.otherUser;
        const name = chat.is_group ? chat.name : (otherUser ? auth.getDisplayName(otherUser) : 'Чат');
        const initials = chat.is_group ? (chat.name ? chat.name[0] : 'Г') : (otherUser ? auth.getInitials(otherUser) : '?');
        
        this.elements.chatName.textContent = name;
        this.elements.chatInitials.textContent = initials;
        
        // Мобильный вид
        this.elements.mainScreen.classList.add('chat-open');
        
        // Загружаем сообщения
        await this.loadMessages(chat.id);
        
        // Отмечаем как прочитанное
        await chatManager.markAsRead(chat.id);
        
        // Обновляем счётчик в списке
        const chatItem = document.querySelector(`[data-chat-id="${chat.id}"]`);
        const unreadBadge = chatItem?.querySelector('.chat-item-unread');
        if (unreadBadge) unreadBadge.remove();
        
        // Подписываемся на новые сообщения
        chatManager.subscribeToMessages(chat.id, (event) => {
            if (event.type === 'insert') {
                this.addMessageToUI(event.data);
                chatManager.markAsRead(chat.id);
            }
        });
    }

    showNoChatSelected() {
        this.elements.noChatSelected.style.display = 'flex';
        this.elements.chatContainer.style.display = 'none';
        chatManager.setCurrentChat(null);
    }

    closeChatMobile() {
        this.elements.mainScreen.classList.remove('chat-open');
        this.showNoChatSelected();
    }

    // ===== СООБЩЕНИЯ =====
    
    async loadMessages(chatId) {
        this.elements.messagesContainer.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;">Загрузка...</div>';
        
        const messages = await chatManager.loadMessages(chatId);
        
        this.elements.messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            this.elements.messagesContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                    Нет сообщений. Начните разговор!
                </div>
            `;
            return;
        }
        
        let lastDate = null;
        
        messages.forEach(message => {
            // Добавляем разделитель даты
            const msgDate = new Date(message.created_at).toDateString();
            if (msgDate !== lastDate) {
                this.addDateDivider(message.created_at);
                lastDate = msgDate;
            }
            
            this.addMessageToUI(message, false);
        });
        
        this.scrollToBottom();
    }

    addDateDivider(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        
        let text;
        if (date.toDateString() === now.toDateString()) {
            text = 'Сегодня';
        } else if (date.toDateString() === new Date(now - 86400000).toDateString()) {
            text = 'Вчера';
        } else {
            text = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
        
        const divider = document.createElement('div');
        divider.className = 'date-divider';
        divider.innerHTML = `<span>${text}</span>`;
        this.elements.messagesContainer.appendChild(divider);
    }

    addMessageToUI(message, scroll = true) {
        const user = auth.getUser();
        const isSent = message.sender_id === user.id;
        
        const div = document.createElement('div');
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-bubble">${this.escapeHtml(message.content)}</div>
            <span class="message-time">${chatManager.formatMessageTime(message.created_at)}</span>
        `;
        
        this.elements.messagesContainer.appendChild(div);
        
        if (scroll) {
            this.scrollToBottom();
        }
    }

    async handleSendMessage() {
        const chat = chatManager.getCurrentChat();
        if (!chat) return;
        
        const content = this.elements.messageInput.value.trim();
        if (!content) return;
        
        this.elements.messageInput.value = '';
        
        try {
            const message = await chatManager.sendMessage(chat.id, content);
            // Сообщение добавится через realtime подписку
        } catch (error) {
            console.error('Failed to send message:', error);
            this.elements.messageInput.value = content;
            alert('Не удалось отправить сообщение');
        }
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    // ===== МОДАЛЬНОЕ ОКНО НОВОГО ЧАТА =====
    
    async openNewChatModal() {
        this.elements.newChatModal.classList.add('active');
        this.elements.searchUsers.value = '';
        await this.loadUsersForModal();
    }

    closeNewChatModal() {
        this.elements.newChatModal.classList.remove('active');
    }

    async loadUsersForModal(query = '') {
        this.elements.usersList.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;">Загрузка...</div>';
        
        const users = await chatManager.searchUsers(query);
        
        this.elements.usersList.innerHTML = '';
        
        if (users.length === 0) {
            this.elements.usersList.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 20px;">
                    Пользователи не найдены
                </div>
            `;
            return;
        }
        
        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `
                <div class="user-item-avatar">${auth.getInitials(user)}</div>
                <div>
                    <div class="user-item-name">${this.escapeHtml(auth.getDisplayName(user))}</div>
                    ${user.username ? `<div class="user-item-username">@${this.escapeHtml(user.username)}</div>` : ''}
                </div>
            `;
            
            div.addEventListener('click', () => this.startChatWithUser(user));
            this.elements.usersList.appendChild(div);
        });
    }

    async handleSearchUsers(query) {
        await this.loadUsersForModal(query);
    }

    async startChatWithUser(user) {
        this.closeNewChatModal();
        
        try {
            const chat = await chatManager.createChat(user.id);
            await this.loadChats();
            this.openChat(chat);
        } catch (error) {
            console.error('Failed to create chat:', error);
            alert('Не удалось создать чат');
        }
    }

    // ===== УТИЛИТЫ =====
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
