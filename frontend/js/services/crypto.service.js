// End-to-End Encryption Service using Web Crypto API
// Simplified: Room-based encryption only (no direct messages)
class CryptoService {
    constructor() {
        this.roomKeys = new Map(); // roomId -> AES key
    }

    // Initialize encryption for a room
    async initRoom(roomId) {
        // Check if we already have a key for this room
        const storedKey = localStorage.getItem(`room_key_${roomId}`);
        
        if (storedKey) {
            await this.importRoomKey(roomId, storedKey);
        } else {
            await this.generateRoomKey(roomId);
        }
    }

    // Generate a new AES key for a room
    async generateRoomKey(roomId) {
        const key = await window.crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        
        this.roomKeys.set(roomId, key);
        
        // Export and store for persistence
        const exportedKey = await window.crypto.subtle.exportKey('raw', key);
        const keyBase64 = this.arrayBufferToBase64(exportedKey);
        localStorage.setItem(`room_key_${roomId}`, keyBase64);
        
        return keyBase64;
    }

    // Import a room key from base64
    async importRoomKey(roomId, keyBase64) {
        const keyBuffer = this.base64ToArrayBuffer(keyBase64);
        const key = await window.crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        
        this.roomKeys.set(roomId, key);
        localStorage.setItem(`room_key_${roomId}`, keyBase64);
    }

    // Get room key as base64 (for sharing)
    async getRoomKeyBase64(roomId) {
        const key = this.roomKeys.get(roomId);
        if (!key) return null;
        
        const exportedKey = await window.crypto.subtle.exportKey('raw', key);
        return this.arrayBufferToBase64(exportedKey);
    }

    // Check if we have a key for a room
    hasRoomKey(roomId) {
        return this.roomKeys.has(roomId) || localStorage.getItem(`room_key_${roomId}`) !== null;
    }

    // Encrypt message for a room
    async encrypt(message, roomId) {
        let key = this.roomKeys.get(roomId);
        
        if (!key) {
            // Try to load from storage
            const storedKey = localStorage.getItem(`room_key_${roomId}`);
            if (storedKey) {
                await this.importRoomKey(roomId, storedKey);
                key = this.roomKeys.get(roomId);
            } else {
                // Generate new key
                await this.generateRoomKey(roomId);
                key = this.roomKeys.get(roomId);
            }
        }

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedMessage = new TextEncoder().encode(message);

        const encryptedData = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encodedMessage
        );

        return {
            ciphertext: this.arrayBufferToBase64(encryptedData),
            iv: this.arrayBufferToBase64(iv),
            keyId: roomId
        };
    }

    // Decrypt message
    async decrypt(encryptedData, roomId) {
        let key = this.roomKeys.get(roomId);
        
        if (!key) {
            // Try to load from storage
            const storedKey = localStorage.getItem(`room_key_${roomId}`);
            if (storedKey) {
                await this.importRoomKey(roomId, storedKey);
                key = this.roomKeys.get(roomId);
            }
        }

        if (!key) {
            throw new Error('No key available for room: ' + roomId);
        }

        const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
        const iv = this.base64ToArrayBuffer(encryptedData.iv);

        const decryptedData = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decryptedData);
    }

    // Utility: ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Utility: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Clear all keys (on logout)
    clear() {
        this.roomKeys.clear();
    }
}