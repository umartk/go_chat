# Simple Chat App with Authentication

A real-time chat application built with HTML/JavaScript frontend and Go backend using WebSockets and JWT authentication.

## Project Structure

```
├── frontend/           # Frontend files
│   ├── index.html     # Main HTML page with auth and chat UI
│   └── chat.js        # JavaScript WebSocket client with authentication
├── backend/           # Go backend server
│   ├── main.go        # WebSocket server with JWT auth implementation
│   └── go.mod         # Go module dependencies
└── README.md          # This file
```

## Features

- **Authentication**: JWT-based login/register system
- **Secure WebSockets**: Token-based WebSocket authentication
- **Real-time messaging**: WebSocket communication with username display
- **Multiple client support**: Broadcast messages to all connected users
- **Auto-reconnection**: Automatic reconnection on connection loss
- **Persistent sessions**: Login state persisted in localStorage
- **Clean UI**: Responsive design with separate auth and chat interfaces

## Security Features

- **Password hashing**: bcrypt for secure password storage
- **JWT tokens**: Secure token-based authentication
- **WebSocket security**: Token validation for WebSocket connections
- **CORS handling**: Proper cross-origin request handling

## Setup and Running

### Backend (Go Server)

1. Navigate to the backend directory:
   ```cmd
   cd backend
   ```

2. Install dependencies:
   ```cmd
   go mod tidy
   ```

3. Run the server:
   ```cmd
   go run main.go
   ```

The server will start on `http://localhost:8080`

### Frontend

The frontend is served automatically by the Go server. Once the backend is running:

1. Open your browser and go to `http://localhost:8080`
2. Register a new account or login with default credentials
3. Start chatting!

## Default Users

The application comes with pre-configured users for testing:
- **Username**: `admin`, **Password**: `password`
- **Username**: `user1`, **Password**: `password`

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Login with existing credentials
- `GET /ws?token=<jwt_token>` - WebSocket connection with authentication

## Usage

1. **Registration/Login**: 
   - Open `http://localhost:8080`
   - Register a new account or login with existing credentials
   - Toggle between login and register modes

2. **Chat**:
   - After successful authentication, you'll be redirected to the chat interface
   - Type messages and press Enter or click Send
   - Messages appear in real-time across all connected clients
   - Your messages appear on the right, others on the left with usernames

3. **Logout**:
   - Click the Logout button to end your session
   - This clears your stored token and disconnects from the chat

## Technical Details

- **Backend**: Go with Gorilla WebSocket and JWT libraries
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: JWT tokens with 24-hour expiration
- **Password Security**: bcrypt hashing with cost 14
- **Communication**: JSON messages over authenticated WebSocket
- **Storage**: In-memory user store (use database in production)
- **Port**: 8080 (configurable in main.go)

## Dependencies

- Go 1.21+
- github.com/gorilla/websocket v1.5.1
- github.com/golang-jwt/jwt/v5 v5.2.0
- golang.org/x/crypto v0.17.0

## Production Considerations

- Replace in-memory user storage with a proper database
- Use environment variables for JWT secret
- Implement proper logging and monitoring
- Add rate limiting for API endpoints
- Use HTTPS in production
- Implement proper session management
- Add input validation and sanitization