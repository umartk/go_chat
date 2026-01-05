# Simple Chat App with Authentication

A real-time chat application with JWT authentication, built with HTML/JavaScript frontend and Go backend using WebSockets.

## Project Structure

```
├── frontend/
│   ├── index.html      # Main HTML with routing
│   ├── styles.css      # Modern dark theme styles
│   ├── config.js       # Configurable settings
│   └── app.js          # Application logic
├── backend/
│   ├── main.go         # Go server with JWT auth
│   ├── go.mod          # Go dependencies
│   ├── .env            # Environment variables (create from .env.example)
│   └── .env.example    # Example environment file
├── .gitignore
└── README.md
```

## Features

- JWT-based authentication (login/register)
- Secure WebSocket connections
- Real-time messaging with usernames
- Modern dark theme UI
- Hash-based routing (login, register, chat)
- Auto-reconnection
- Responsive design

## Setup

### 1. Backend Configuration

Copy the example environment file and customize:

```cmd
cd backend
copy .env.example .env
```

Edit `.env` to set your own values:
```
JWT_SECRET=your-secure-secret-key
SERVER_PORT=8080
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASSWORD=your-password
```

### 2. Install Dependencies

```cmd
cd backend
go mod tidy
```

### 3. Run the Server

```cmd
go run main.go
```

### 4. Access the App

Open `http://localhost:8080` in your browser.

## Default Users

Configured in `.env`:
- admin / password
- user1 / password

## Frontend Configuration

Edit `frontend/config.js` to change the server URL:

```javascript
const CONFIG = {
    SERVER_URL: 'http://localhost:8080',
    // ...
};
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login | User login |
| POST | /api/register | User registration |
| GET | /ws?token=JWT | WebSocket connection |

## Tech Stack

- **Backend**: Go, Gorilla WebSocket, JWT, bcrypt
- **Frontend**: Vanilla JS, CSS3, HTML5
- **Auth**: JWT tokens (24h expiry), bcrypt password hashing