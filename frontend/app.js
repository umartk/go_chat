// Router - handles page navigation
class Router {
    constructor() {
        this.routes = {
            'login': 'login-page',
            'register': 'register-page',
            'chat': 'chat-page'
        };
        
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }
    
    navigate(route) {
        window.location.hash = route;
    }
    
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        this.showPage(hash);
    }
    
    showPage(route) {
        // Hide all pages
        Object.values(this.routes).forEach(pageId => {
            document.getElementById(pageId)?.classList.add('hidden');
        });
        
        // Show requested page
        const pageId = this.routes[route];
        if (pageId) {
            document.getElementById(pageId)?.classList.remove('hidden');
        }
    }
}

// Auth Service - handles authentication
class AuthService {
    constructor() {
        this.token = localStorage.getItem(CONFIG.STORAGE.TOKEN);
        this.username = localStorage.getItem(CONFIG.STORAGE.USERNAME);
    }
    
    isAuthenticated() {
        return !!this.token && !!this.username;
    }
    
    async login(username, password) {
        const response = await fetch(`${CONFIG.SERVER_URL}${CONFIG.API.LOGIN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.setSession(data.token, data.username);
        }
        
        return data;
    }
    
    async register(username, password) {
        const response = await fetch(`${CONFIG.SERVER_URL}${CONFIG.API.REGISTER}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            this.setSession(data.token, data.username);
        }
        
        return data;
    }
    
    setSession(token, username) {
        this.token = token;
        this.username = username;
        localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
        localStorage.setItem(CONFIG.STORAGE.USERNAME, username);
    }
    
    logout() {
        this.token = null;
        this.username = null;
        localStorage.removeItem(CONFIG.STORAGE.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE.USERNAME);
    }
}

// Chat Service - handles WebSocket communication
class ChatService {
    constructor() {
        this.ws = null;
        this.onMessage = null;
        this.onStatusChange = null;
    }
    
    connect(token) {
        if (this.ws) {
            this.ws.close();
        }
        
        this.updateStatus('connecting');
        
        const wsUrl = `${CONFIG.WS_URL}${CONFIG.API.WEBSOCKET}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.updateStatus('connected');
        };
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (this.onMessage) {
                this.onMessage(message);
            }
        };
        
        this.ws.onclose = () => {
            this.updateStatus('disconnected');
            // Auto-reconnect
            setTimeout(() => {
                if (token) this.connect(token);
            }, CONFIG.RECONNECT_DELAY);
        };
        
        this.ws.onerror = () => {
            this.updateStatus('disconnected');
        };
    }
    
    send(content) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                content,
                timestamp: new Date().toISOString()
            }));
            return true;
        }
        return false;
    }
    
    disconnect() {
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

// Main Application
class ChatApp {
    constructor() {
        this.router = new Router();
        this.auth = new AuthService();
        this.chat = new ChatService();
        
        this.initElements();
        this.initEventListeners();
        this.initChatCallbacks();
        this.checkAuth();
    }
    
    initElements() {
        // Login elements
        this.loginForm = document.getElementById('login-form');
        this.loginUsername = document.getElementById('login-username');
        this.loginPassword = document.getElementById('login-password');
        this.loginMessage = document.getElementById('login-message');
        
        // Register elements
        this.registerForm = document.getElementById('register-form');
        this.registerUsername = document.getElementById('register-username');
        this.registerPassword = document.getElementById('register-password');
        this.registerConfirm = document.getElementById('register-confirm');
        this.registerMessage = document.getElementById('register-message');
        
        // Chat elements
        this.messagesContainer = document.getElementById('messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.connectionStatus = document.getElementById('connection-status');
        this.currentUser = document.getElementById('current-user');
        this.logoutBtn = document.getElementById('logout-btn');
    }
    
    initEventListeners() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Register form
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // Message form
        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
        
        // Logout button
        this.logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });
    }
    
    initChatCallbacks() {
        this.chat.onMessage = (message) => {
            this.displayMessage(message);
        };
        
        this.chat.onStatusChange = (status) => {
            this.updateConnectionStatus(status);
        };
    }
    
    checkAuth() {
        if (this.auth.isAuthenticated()) {
            this.router.navigate('chat');
            this.currentUser.textContent = this.auth.username;
            this.chat.connect(this.auth.token);
        } else {
            this.router.navigate('login');
        }
    }
    
    async handleLogin() {
        const username = this.loginUsername.value.trim();
        const password = this.loginPassword.value;
        
        this.showMessage(this.loginMessage, '', '');
        
        try {
            const result = await this.auth.login(username, password);
            
            if (result.success) {
                this.showMessage(this.loginMessage, result.message, 'success');
                setTimeout(() => {
                    this.router.navigate('chat');
                    this.currentUser.textContent = this.auth.username;
                    this.chat.connect(this.auth.token);
                }, 500);
            } else {
                this.showMessage(this.loginMessage, result.message, 'error');
            }
        } catch (error) {
            this.showMessage(this.loginMessage, 'Network error. Please try again.', 'error');
        }
    }
    
    async handleRegister() {
        const username = this.registerUsername.value.trim();
        const password = this.registerPassword.value;
        const confirm = this.registerConfirm.value;
        
        this.showMessage(this.registerMessage, '', '');
        
        if (password !== confirm) {
            this.showMessage(this.registerMessage, 'Passwords do not match', 'error');
            return;
        }
        
        try {
            const result = await this.auth.register(username, password);
            
            if (result.success) {
                this.showMessage(this.registerMessage, result.message, 'success');
                setTimeout(() => {
                    this.router.navigate('chat');
                    this.currentUser.textContent = this.auth.username;
                    this.chat.connect(this.auth.token);
                }, 500);
            } else {
                this.showMessage(this.registerMessage, result.message, 'error');
            }
        } catch (error) {
            this.showMessage(this.registerMessage, 'Network error. Please try again.', 'error');
        }
    }
    
    handleSendMessage() {
        const content = this.messageInput.value.trim();
        
        if (content && this.chat.send(content)) {
            this.messageInput.value = '';
        }
    }
    
    handleLogout() {
        this.chat.disconnect();
        this.auth.logout();
        this.messagesContainer.innerHTML = '';
        this.loginForm.reset();
        this.registerForm.reset();
        this.router.navigate('login');
    }
    
    showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'message-box';
        if (type) {
            element.classList.add(type);
        }
    }
    
    displayMessage(message) {
        const isOwn = message.username === this.auth.username;
        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own' : 'other'}`;
        messageEl.innerHTML = `
            <div class="message-bubble">${this.escapeHtml(message.content)}</div>
            <div class="message-meta">
                <span class="message-username">${isOwn ? 'You' : this.escapeHtml(message.username)}</span>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageEl);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    updateConnectionStatus(status) {
        this.connectionStatus.className = `status ${status}`;
        const statusText = {
            'connected': 'Connected',
            'disconnected': 'Disconnected',
            'connecting': 'Connecting...'
        };
        this.connectionStatus.textContent = statusText[status] || status;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});