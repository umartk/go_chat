package main

import (
	"log"
	"net/http"

	"chat-app/config"
	"chat-app/handlers"
	"chat-app/store"
	"chat-app/websocket"
)

func main() {
	// Load configuration
	config.Load()

	// Initialize default users
	store.InitDefaultUsers()

	// Create WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Setup routes
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/register", handlers.RegisterHandler)
	mux.HandleFunc("/api/login", handlers.LoginHandler)

	// WebSocket route
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.HandleWebSocket(hub, w, r)
	})

	// Serve static files
	fs := http.FileServer(http.Dir("../frontend/"))
	mux.Handle("/", fs)

	// Start server
	log.Printf("Server starting on :%s", config.AppConfig.ServerPort)
	log.Printf("Access the app at: http://localhost:%s", config.AppConfig.ServerPort)
	log.Fatal(http.ListenAndServe(":"+config.AppConfig.ServerPort, mux))
}