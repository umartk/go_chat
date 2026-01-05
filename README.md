# Simple Chat App

A real-time chat application built with HTML/JavaScript frontend and Go backend using WebSockets.

## Project Structure

```
├── frontend/           # Frontend files
│   ├── index.html     # Main HTML page
│   └── chat.js        # JavaScript WebSocket client
├── backend/           # Go backend server
│   ├── main.go        # WebSocket server implementation
│   └── go.mod         # Go module dependencies
└── README.md          # This file
```

## Features

- Real-time messaging using WebSockets
- Multiple client support
- Auto-reconnection on connection loss
- Simple and clean UI
- Message broadcasting to all connected clients

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
2. Start chatting!

## Usage

1. Open multiple browser tabs/windows to `http://localhost:8080`
2. Type messages in any window
3. Messages will appear in real-time across all connected clients
4. The status indicator shows connection state

## Technical Details

- **Backend**: Go with Gorilla WebSocket library
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Communication**: JSON messages over WebSocket
- **Port**: 8080 (configurable in main.go)

## Dependencies

- Go 1.21+
- github.com/gorilla/websocket v1.5.1