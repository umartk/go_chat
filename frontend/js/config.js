// Application Configuration
const CONFIG = {
    // Server URL - change this to match your backend server
    SERVER_URL: 'http://localhost:3000',
    
    // WebSocket URL (automatically derived from SERVER_URL)
    get WS_URL() {
        const protocol = this.SERVER_URL.startsWith('https') ? 'wss:' : 'ws:';
        const host = this.SERVER_URL.replace(/^https?:\/\//, '');
        return `${protocol}//${host}`;
    },
    
    // API Endpoints
    API: {
        LOGIN: '/api/login',
        REGISTER: '/api/register',
        WEBSOCKET: '/ws'
    },
    
    // Storage Keys
    STORAGE: {
        TOKEN: 'chat_token',
        USERNAME: 'chat_username'
    },
    
    // Reconnection settings
    RECONNECT_DELAY: 3000
};