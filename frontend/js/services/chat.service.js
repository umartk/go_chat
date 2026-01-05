// Chat Service - handles WebSocket communication
class ChatService {
    constructor() {
        this.ws = null;
        this.onMessage = null;
        this.onStatusChange = null;
        this.token = null;
    }
    
    connect(token) {
        this.token = token;
        
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
            // Auto-reconnect if token exists
            if (this.token) {
                setTimeout(() => this.connect(this.token), CONFIG.RECONNECT_DELAY);
            }
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
        this.token = null;
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