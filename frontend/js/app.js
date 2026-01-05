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
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSendMessage();
        });
        
        this.logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    
    initChatCallbacks() {
        this.chat.onMessage = (message) => this.displayMessage(message);
        this.chat.onStatusChange = (status) => this.updateConnectionStatus(status);
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
        
        Utils.showMessage(this.loginMessage, '', '');
        
        try {
            const result = await this.auth.login(username, password);
            
            if (result.success) {
                Utils.showMessage(this.loginMessage, result.message, 'success');
                setTimeout(() => {
                    this.router.navigate('chat');
                    this.currentUser.textContent = this.auth.username;
                    this.chat.connect(this.auth.token);
                }, 500);
            } else {
                Utils.showMessage(this.loginMessage, result.message, 'error');
            }
        } catch (error) {
            Utils.showMessage(this.loginMessage, 'Network error. Please try again.', 'error');
        }
    }
    
    async handleRegister() {
        const username = this.registerUsername.value.trim();
        const password = this.registerPassword.value;
        const confirm = this.registerConfirm.value;
        
        Utils.showMessage(this.registerMessage, '', '');
        
        if (password !== confirm) {
            Utils.showMessage(this.registerMessage, 'Passwords do not match', 'error');
            return;
        }
        
        try {
            const result = await this.auth.register(username, password);
            
            if (result.success) {
                Utils.showMessage(this.registerMessage, result.message, 'success');
                setTimeout(() => {
                    this.router.navigate('chat');
                    this.currentUser.textContent = this.auth.username;
                    this.chat.connect(this.auth.token);
                }, 500);
            } else {
                Utils.showMessage(this.registerMessage, result.message, 'error');
            }
        } catch (error) {
            Utils.showMessage(this.registerMessage, 'Network error. Please try again.', 'error');
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
    
    displayMessage(message) {
        const isOwn = message.username === this.auth.username;
        const time = Utils.formatTime(message.timestamp);
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own' : 'other'}`;
        messageEl.innerHTML = `
            <div class="message-bubble">${Utils.escapeHtml(message.content)}</div>
            <div class="message-meta">
                <span class="message-username">${isOwn ? 'You' : Utils.escapeHtml(message.username)}</span>
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
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});