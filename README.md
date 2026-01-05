# Chat App

A modular real-time chat application with JWT authentication.

## Project Structure

```
├── backend/
│   ├── auth/
│   │   ├── jwt.go          # JWT token generation/validation
│   │   └── password.go     # Password hashing
│   ├── config/
│   │   └── config.go       # Environment configuration
│   ├── handlers/
│   │   ├── auth_handler.go # Login/Register handlers
│   │   └── helpers.go      # HTTP helper functions
│   ├── models/
│   │   └── models.go       # Data structures
│   ├── store/
│   │   └── user_store.go   # User storage
│   ├── websocket/
│   │   ├── client.go       # WebSocket client
│   │   ├── handler.go      # WebSocket handler
│   │   └── hub.go          # Connection hub
│   ├── main.go             # Entry point
│   ├── go.mod
│   ├── .env                # Environment variables
│   └── .env.example
│
├── frontend/
│   ├── css/
│   │   ├── variables.css   # CSS variables/theme
│   │   ├── base.css        # Base styles
│   │   ├── auth.css        # Auth page styles
│   │   └── chat.css        # Chat page styles
│   ├── js/
│   │   ├── services/
│   │   │   ├── auth.service.js   # Authentication service
│   │   │   └── chat.service.js   # WebSocket service
│   │   ├── utils/
│   │   │   └── helpers.js  # Utility functions
│   │   ├── config.js       # Frontend configuration
│   │   ├── router.js       # Hash-based routing
│   │   └── app.js          # Main application
│   └── index.html
│
├── .gitignore
└── README.md
```

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
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASSWORD=your-password
```

### 2. Install & Run

```cmd
cd backend
go mod tidy
go run main.go
```

### 3. Access

Open `http://localhost:8080`

## Frontend Configuration

Edit `frontend/js/config.js`:
```javascript
const CONFIG = {
    SERVER_URL: 'http://localhost:8080',
    // ...
};
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login | User login |
| POST | /api/register | User registration |
| WS | /ws?token=JWT | WebSocket connection |

## Tech Stack

- **Backend**: Go, Gorilla WebSocket, JWT, bcrypt, godotenv
- **Frontend**: Vanilla JS (modular), CSS3, HTML5