// Chat Service - handles WebSocket communication with E2EE
class ChatService {
    constructor() {
        this.ws = null;
        this.token = null;
        this.username = null;
        this.crypto = new CryptoService();
        
        // Callbacks
        this.onMessage = null;
        this.onStatusChange = null;
        this.onUserListUpdate = null;
        this.onSystemMessage = null;
        
        // State
        this.users = new Map();
    }
    
    async connect(token, username) {
        this.token = token;
        this.username = username;
        
        if (this.ws) {
            this.ws.close();
        }
        
        this.updateStatus('connecting');
        
        // Initialize encryption for general room
        await this.crypto.initRoom('general');
        
        const wsUrl = `${CONFIG.WS_URL}${CONFIG.API.WEBSOCKET}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.updateStatus('connected');
            // Request room key if we don't have one
            this.requestRoomKey('general');
        };
        
        this.ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            await this.handleMessage(message);
        };
        
        this.ws.onclose = () => {
            this.updateStatus('disconnected');
            if (this.token) {
                setTimeout(() => this.connect(this.token, this.username), CONFIG.RECONNECT_DELAY);
            }
        };
        
        this.ws.onerror = () => {
            this.updateStatus('disconnected');
        };
    }
    
    async handleMessage(message) {
        switch (message.type) {
            case 'user_list':
                this.handleUserList(message.data);
                break;
                
            case 'system':
                this.handleSystemMessage(message);
                break;
                
            case 'room_key':
                await this.handleRoomKey(message);
                break;
                
            case 'request_key':
                await this.handleKeyRequest(message);
                break;
                
            case 'chat':
            default:
                await this.handleChatMessage(message);
                break;
        }
    }
    
    handleUserList(data) {
        if (data.users) {
            this.users.clear();
            data.users.forEach(user => {
                this.users.set(user.username, user);
            });
        }
        if (this.onUserListUpdate) {
            this.onUserListUpdate(Array.from(this.users.keys()));
        }
    }
    
    handleSystemMessage(message) {
        if (message.data?.event === 'user_joined') {
            this.users.set(message.username, { username: message.username });
            if (this.onUserListUpdate) {
                this.onUserListUpdate(Array.from(this.users.keys()));
            }
            // Share room key with new user
            this.shareRoomKey('general', message.username);
        } else if (message.data?.event === 'user_left') {
            this.users.delete(message.username);
            if (this.onUserListUpdate) {
                this.onUserListUpdate(Array.from(this.users.keys()));
            }
        }
        
        if (this.onSystemMessage) {
            this.onSystemMessage(message);
        }
    }
    
    async handleRoomKey(message) {
        if (message.data?.key && message.roomId) {
            await this.crypto.importRoomKey(message.roomId, message.data.key);
            console.log('Received room key for:', message.roomId);
        }
    }
    
    async handleKeyRequest(message) {
        if (message.roomId && message.username) {
            await this.shareRoomKey(message.roomId, message.username);
        }
    }
    
    async handleChatMessage(message) {
        let decryptedContent = message.content;
        
        if (message.encrypted) {
            try {
                decryptedContent = await this.crypto.decrypt(message.encrypted, 'general');
            } catch (error) {
                console.error('Decryption failed:', error);
                this.requestRoomKey('general');
                decryptedContent = '[Waiting for encryption key...]';
            }
        }
        
        if (this.onMessage) {
            this.onMessage({
                ...message,
                content: decryptedContent,
                isEncrypted: !!message.encrypted
            });
        }
    }
    
    // Send encrypted message
    async send(content) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
        
        try {
            if (!this.crypto.hasRoomKey('general')) {
                await this.crypto.initRoom('general');
            }
            
            const encrypted = await this.crypto.encrypt(content, 'general');
            
            this.ws.send(JSON.stringify({
                type: 'chat',
                roomId: 'general',
                encrypted: encrypted,
                timestamp: new Date().toISOString()
            }));
            
            return true;
        } catch (error) {
            console.error('Encryption failed:', error);
            return false;
        }
    }
    
    requestRoomKey(roomId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_key',
                roomId: roomId
            }));
        }
    }
    
    async shareRoomKey(roomId, targetUser) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (targetUser === this.username) return;
        
        try {
            const keyBase64 = await this.crypto.getRoomKeyBase64(roomId);
            if (keyBase64) {
                this.ws.send(JSON.stringify({
                    type: 'room_key',
                    roomId: roomId,
                    recipient: targetUser,
                    data: { key: keyBase64 }
                }));
            }
        } catch (error) {
            console.error('Failed to share room key:', error);
        }
    }
    
    disconnect() {
        this.token = null;
        this.crypto.clear();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    
    updateStatus(status) {
        if (this.onStatusChange) {
            this.onStatusChange(status);
        }
    }
}