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