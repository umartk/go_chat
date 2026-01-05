// Utility functions
const Utils = {
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },
    
    showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'message-box';
        if (type) {
            element.classList.add(type);
        }
    }
};