class ChatApp {
    constructor() {
        this.ws = null;
        this.token = localStorage.getItem('chatToken');
        this.username = localStorage.getItem('chatUsername');
        this.isLogin = true;
        
        // Configurable server URL - change this to match your server
        this.serverUrl = 'http://localhost:8080';
        
        // DOM elements
        this.authSection = document.getElementById('auth-section');
        this.chatSection = document.getElementById('chat-section');
        this.authForm = document.getElementById('auth-form');
        this.authTitle = document.getElementById('auth-title');
        this.authSubmit = document.getElementById('auth-submit');
        this.authToggleText = document.getElementById('auth-toggle-text');
        this.authToggleLink = document.getElementById('auth-toggle-link');
        this.authMessage = document.getElementById('auth-message');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        
        this.chatContainer = document.getElementById('chat-container');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.statusDiv = document.getElementById('status');
        this.currentUserSpan = document.getElementById('current-user');
        this.logoutBtn = document.getElementById('logout-btn');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Check if user is already logged in
        if (this.token && this.username) {
            this.showChatSection();
            this.connect();
        } else {
            this.showAuthSection();
        }
    }

    setupEventListeners() {
        this.authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });

        this.authToggleLink.addEventListener('click', () => {
            this.toggleAuthMode();
        });

        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        this.logoutBtn.addEventListener('click', () => {
            this.logout();
        });
    }

    toggleAuthMode() {
        this.isLogin = !this.isLogin;
        if (this.isLogin) {
            this.authTitle.textContent = 'Login to Chat';
            this.authSubmit.textContent = 'Login';
            this.authToggleText.textContent = "Don't have an account?";
            this.authToggleLink.textContent = 'Register here';
        } else {
            this.authTitle.textContent = 'Register for Chat';
            this.authSubmit.textContent = 'Register';
            this.authToggleText.textContent = 'Already have an account?';
            this.authToggleLink.textContent = 'Login here';
        }
        this.clearAuthMessage();
    }

    async handleAuth() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username || !password) {
            this.showAuthMessage('Please fill in all fields', 'error');
            return;
        }

        const endpoint = this.isLogin ? '/api/login' : '/api/register';
        const fullUrl = `${this.serverUrl}${endpoint}`;
        
        try {
            console.log('Making request to:', fullUrl);
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                this.token = data.token;
                this.username = data.username;
                
                // Store in localStorage
                localStorage.setItem('chatToken', this.token);
                localStorage.setItem('chatUsername', this.username);
                
                this.showAuthMessage(data.message, 'success');
                
                setTimeout(() => {
                    this.showChatSection();
                    this.connect();
                }, 1000);
            } else {
                this.showAuthMessage(data.message || 'Authentication failed', 'error');
            }
        } catch (error) {
            console.error('Auth error details:', error);
            this.showAuthMessage(`Network error: ${error.message}`, 'error');
        }
    }

    showAuthMessage(message, type) {
        this.authMessage.textContent = message;
        this.authMessage.className = type;
    }

    clearAuthMessage() {
        this.authMessage.textContent = '';
        this.authMessage.className = '';
    }

    showAuthSection() {
        this.authSection.classList.remove('hidden');
        this.chatSection.classList.add('hidden');
    }

    showChatSection() {
        this.authSection.classList.add('hidden');
        this.chatSection.classList.remove('hidden');
        this.currentUserSpan.textContent = this.username;
    }

    logout() {
        // Clear stored data
        localStorage.removeItem('chatToken');
        localStorage.removeItem('chatUsername');
        
        // Close WebSocket connection
        if (this.ws) {
            this.ws.close();
        }
        
        // Reset state
        this.token = null;
        this.username = null;
        
        // Clear chat
        this.chatContainer.innerHTML = '';
        
        // Show auth section
        this.showAuthSection();
        this.updateStatus('Disconnected', false);
        
        // Clear form
        this.usernameInput.value = '';
        this.passwordInput.value = '';
    }

    connect() {
        if (!this.token) {
            console.error('No token available for WebSocket connection');
            return;
        }

        try {
            // Use configurable server URL for WebSocket connection
            const wsProtocol = this.serverUrl.startsWith('https') ? 'wss:' : 'ws:';
            const wsHost = this.serverUrl.replace(/^https?:\/\//, '');
            const wsUrl = `${wsProtocol}//${wsHost}/ws?token=${encodeURIComponent(this.token)}`;
            
            console.log('Connecting to WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.updateStatus('Connected', true);
                console.log('Connected to WebSocket server');
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.displayMessage(message.content, message.username, message.username === this.username);
            };

            this.ws.onclose = () => {
                this.updateStatus('Disconnected', false);
                console.log('Disconnected from WebSocket server');
                
                // Only attempt to reconnect if we still have a token
                if (this.token) {
                    setTimeout(() => this.connect(), 3000);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('Connection Error', false);
            };
        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateStatus('Connection Failed', false);
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageData = {
                content: message,
                timestamp: new Date().toISOString()
            };
            
            this.ws.send(JSON.stringify(messageData));
            this.messageInput.value = '';
        }
    }

    displayMessage(content, username, isOwn) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        
        const usernameDiv = document.createElement('div');
        usernameDiv.className = 'message-username';
        usernameDiv.textContent = isOwn ? 'You' : username;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(usernameDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatContainer.appendChild(messageDiv);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    updateStatus(message, isConnected) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = isConnected ? 'connected' : 'disconnected';
    }
}

// Initialize the chat app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});