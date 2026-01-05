class ChatApp {
    constructor() {
        this.ws = null;
        this.chatContainer = document.getElementById('chat-container');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.statusDiv = document.getElementById('status');
        
        this.init();
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        try {
            this.ws = new WebSocket('ws://localhost:8080/ws');
            
            this.ws.onopen = () => {
                this.updateStatus('Connected', true);
                console.log('Connected to WebSocket server');
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.displayMessage(message.content, false);
            };

            this.ws.onclose = () => {
                this.updateStatus('Disconnected', false);
                console.log('Disconnected from WebSocket server');
                // Attempt to reconnect after 3 seconds
                setTimeout(() => this.connect(), 3000);
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

    setupEventListeners() {
        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageData = {
                content: message,
                timestamp: new Date().toISOString()
            };
            
            this.ws.send(JSON.stringify(messageData));
            this.displayMessage(message, true);
            this.messageInput.value = '';
        }
    }

    displayMessage(content, isOwn) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        messageDiv.textContent = content;
        
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