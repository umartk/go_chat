# Secure Chat App

A real-time chat application with end-to-end encryption (E2EE), supporting both 1-on-1 and group chats.

## Features

- 🔒 **End-to-End Encryption** - Messages encrypted client-side using ECDH + AES-GCM
- 💬 **Direct Messages** - Private encrypted conversations between users
- 👥 **Group Rooms** - Create and join encrypted chat rooms
- 🔑 **JWT Authentication** - Secure login/registration
- ⚡ **Real-time** - WebSocket-based instant messaging
- 📱 **Responsive** - Works on desktop and mobile

## Project Structure

```
├── backend/
│   ├── auth/           # JWT & password handling
│   ├── config/         # Environment configuration
│   ├── handlers/       # HTTP handlers
│   ├── models/         # Data structures
│   ├── store/          # User, room, key storage
│   ├── websocket/      # WebSocket hub, client, handler
│   ├── main.go
│   └── .env
│
├── frontend/
│   ├── css/
│   │   ├── variables.css
│   │   ├── base.css
│   │   ├── auth.css
│   │   ├── chat.css
│   │   └── sidebar.css
│   ├── js/
│   │   ├── services/
│   │   │   ├── crypto.service.js  # E2EE encryption
│   │   │   ├── auth.service.js
│   │   │   └── chat.service.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── config.js
│   │   ├── router.js
│   │   └── app.js
│   └── index.html
```

## How E2EE Works

### Key Exchange (ECDH)
1. Each user generates an ECDH key pair on login
2. Public keys are shared via the server
3. Shared secrets are derived client-side

### Message Encryption (AES-GCM)
- **Direct Messages**: Encrypted with shared secret between two users
- **Group Messages**: Encrypted with a group key, distributed to members

### Security Properties
- Server cannot read message content
- Forward secrecy per session
- Keys stored locally in browser

## Setup

### 1. Configure Backend

```cmd
cd backend
copy .env.example .env
```

Edit `.env`:
```
JWT_SECRET=your-secure-secret-key
SERVER_PORT=8080
```

### 2. Install & Run

```cmd
cd backend
go mod tidy
go run main.go
```

### 3. Access

Open `http://localhost:8080`

## Usage

### Direct Messages
1. Click on a user in the sidebar
2. Messages are encrypted with your shared key
3. Only you and the recipient can read them

### Group Rooms
1. Click "+" to create a new room
2. Join existing rooms from the sidebar
3. Messages encrypted with the room's group key

## API

| Type | Endpoint/Message | Description |
|------|------------------|-------------|
| POST | /api/login | User login |
| POST | /api/register | User registration |
| WS | /ws | WebSocket connection |
| MSG | chat | Room message |
| MSG | direct | Direct message |
| MSG | join_room | Join a room |
| MSG | key_exchange | Exchange public keys |
| MSG | group_key | Share group encryption key |

## Tech Stack

- **Backend**: Go, Gorilla WebSocket, JWT, bcrypt
- **Frontend**: Vanilla JS, Web Crypto API
- **Encryption**: ECDH (P-256), AES-GCM (256-bit)

## Security Notes

⚠️ For production use:
- Use HTTPS/WSS
- Store keys securely (consider IndexedDB with encryption)
- Implement key verification (fingerprints)
- Add message authentication
- Consider Signal Protocol for better forward secrecy