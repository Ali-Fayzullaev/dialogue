// ========================================
// SUPABASE CLIENT
// ========================================

class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
        this.headers = {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
        this.realtimeSubscriptions = [];
    }

    // ===== REST API МЕТОДЫ =====
    
    async query(table, options = {}) {
        let url = `${this.url}/rest/v1/${table}`;
        const params = new URLSearchParams();
        
        if (options.select) {
            params.append('select', options.select);
        }
        
        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                params.append(key, value);
            }
        }
        
        if (options.order) {
            params.append('order', options.order);
        }
        
        if (options.limit) {
            params.append('limit', options.limit);
        }
        
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: this.headers
        });
        
        if (!response.ok) {
            throw new Error(`Query failed: ${response.statusText}`);
        }
        
        return response.json();
    }

    async insert(table, data) {
        const url = `${this.url}/rest/v1/${table}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Insert failed');
        }
        
        return response.json();
    }

    async update(table, data, filters) {
        let url = `${this.url}/rest/v1/${table}`;
        const params = new URLSearchParams();
        
        for (const [key, value] of Object.entries(filters)) {
            params.append(key, value);
        }
        
        url += `?${params.toString()}`;
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Update failed');
        }
        
        return response.json();
    }

    async delete(table, filters) {
        let url = `${this.url}/rest/v1/${table}`;
        const params = new URLSearchParams();
        
        for (const [key, value] of Object.entries(filters)) {
            params.append(key, value);
        }
        
        url += `?${params.toString()}`;
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.headers
        });
        
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        
        return true;
    }

    // ===== REALTIME =====
    
    subscribe(table, callback, filter = null) {
        const wsUrl = this.url.replace('https://', 'wss://').replace('http://', 'ws://');
        const realtimeUrl = `${wsUrl}/realtime/v1/websocket?apikey=${this.key}&vsn=1.0.0`;
        
        const ws = new WebSocket(realtimeUrl);
        
        ws.onopen = () => {
            console.log('Realtime connected');
            
            // Присоединяемся к каналу
            const topic = filter 
                ? `realtime:public:${table}:${filter}`
                : `realtime:public:${table}`;
            
            const joinMessage = {
                topic: topic,
                event: 'phx_join',
                payload: {
                    config: {
                        broadcast: { self: true },
                        presence: { key: '' }
                    }
                },
                ref: '1'
            };
            
            ws.send(JSON.stringify(joinMessage));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.event === 'INSERT' || data.event === 'UPDATE' || data.event === 'DELETE') {
                callback({
                    type: data.event.toLowerCase(),
                    data: data.payload.record,
                    old: data.payload.old_record
                });
            }
        };
        
        ws.onerror = (error) => {
            console.error('Realtime error:', error);
        };
        
        ws.onclose = () => {
            console.log('Realtime disconnected');
        };
        
        // Heartbeat для поддержания соединения
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    topic: 'phoenix',
                    event: 'heartbeat',
                    payload: {},
                    ref: Date.now().toString()
                }));
            }
        }, 30000);
        
        const subscription = { ws, heartbeat };
        this.realtimeSubscriptions.push(subscription);
        
        return subscription;
    }

    unsubscribe(subscription) {
        if (subscription.heartbeat) {
            clearInterval(subscription.heartbeat);
        }
        if (subscription.ws) {
            subscription.ws.close();
        }
        this.realtimeSubscriptions = this.realtimeSubscriptions.filter(s => s !== subscription);
    }

    unsubscribeAll() {
        this.realtimeSubscriptions.forEach(sub => {
            if (sub.heartbeat) clearInterval(sub.heartbeat);
            if (sub.ws) sub.ws.close();
        });
        this.realtimeSubscriptions = [];
    }

    // ===== RPC (вызов функций) =====
    
    async rpc(functionName, params = {}) {
        const url = `${this.url}/rest/v1/rpc/${functionName}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`RPC failed: ${response.statusText}`);
        }
        
        return response.json();
    }

    // ===== EDGE FUNCTIONS =====
    
    async invoke(functionName, body = {}) {
        const url = `${this.url}/functions/v1/${functionName}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Function invocation failed');
        }
        
        return response.json();
    }
}

// Создаём глобальный экземпляр клиента
const supabase = new SupabaseClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
