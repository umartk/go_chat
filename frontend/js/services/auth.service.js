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