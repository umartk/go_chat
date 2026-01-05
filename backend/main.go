package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// Config holds application configuration
type Config struct {
	JWTSecret  string
	ServerPort string
}

var config Config

// Models
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string `json:"token,omitempty"`
	Username string `json:"username,omitempty"`
	Message  string `json:"message"`
	Success  bool   `json:"success"`
}

type Message struct {
	Content   string    `json:"content"`
	Username  string    `json:"username"`
	Timestamp time.Time `json:"timestamp"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

// Client represents a WebSocket client
type Client struct {
	conn     *websocket.Conn
	send     chan Message
	username string
}

// Hub manages all WebSocket clients
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// UserStore manages users (in-memory, use database in production)
type UserStore struct {
	users map[string]string
	mu    sync.RWMutex
}

var (
	userStore = &UserStore{users: make(map[string]string)}
	upgrader  = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

// Initialize configuration from environment
func initConfig() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using defaults")
	}

	config = Config{
		JWTSecret:  getEnv("JWT_SECRET", "default-secret-change-me"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
	}

	// Initialize default users
	initDefaultUsers()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func initDefaultUsers() {
	adminUser := getEnv("DEFAULT_ADMIN_USER", "admin")
	adminPass := getEnv("DEFAULT_ADMIN_PASSWORD", "password")
	defaultUser := getEnv("DEFAULT_USER", "user1")
	defaultPass := getEnv("DEFAULT_USER_PASSWORD", "password")

	if hash, err := hashPassword(adminPass); err == nil {
		userStore.users[adminUser] = hash
	}
	if hash, err := hashPassword(defaultPass); err == nil {
		userStore.users[defaultUser] = hash
	}
}

// JWT functions
func generateJWT(username string) (string, error) {
	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.JWTSecret))
}

func validateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

// Password functions
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func checkPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// UserStore methods
func (s *UserStore) Get(username string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	hash, exists := s.users[username]
	return hash, exists
}

func (s *UserStore) Set(username, hash string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users[username] = hash
}

func (s *UserStore) Exists(username string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, exists := s.users[username]
	return exists
}

// Hub methods
func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("Client %s connected. Total: %d", client.username, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("Client %s disconnected. Total: %d", client.username, len(h.clients))

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Client methods
func (c *Client) readPump(hub *Hub) {
	defer func() {
		hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg Message
		if err := c.conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		msg.Username = c.username
		msg.Timestamp = time.Now()
		hub.broadcast <- msg
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// HTTP Handlers
func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, LoginResponse{Message: "Method not allowed", Success: false})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, LoginResponse{Message: "Invalid request", Success: false})
		return
	}

	if req.Username == "" || req.Password == "" {
		sendJSON(w, http.StatusBadRequest, LoginResponse{Message: "Username and password required", Success: false})
		return
	}

	if len(req.Username) < 3 || len(req.Password) < 6 {
		sendJSON(w, http.StatusBadRequest, LoginResponse{Message: "Username min 3 chars, password min 6 chars", Success: false})
		return
	}

	if userStore.Exists(req.Username) {
		sendJSON(w, http.StatusConflict, LoginResponse{Message: "Username already exists", Success: false})
		return
	}

	hash, err := hashPassword(req.Password)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, LoginResponse{Message: "Error creating user", Success: false})
		return
	}

	userStore.Set(req.Username, hash)

	token, err := generateJWT(req.Username)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, LoginResponse{Message: "Error generating token", Success: false})
		return
	}

	sendJSON(w, http.StatusCreated, LoginResponse{
		Token:    token,
		Username: req.Username,
		Message:  "Registration successful",
		Success:  true,
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, LoginResponse{Message: "Method not allowed", Success: false})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, LoginResponse{Message: "Invalid request", Success: false})
		return
	}

	hash, exists := userStore.Get(req.Username)
	if !exists || !checkPasswordHash(req.Password, hash) {
		sendJSON(w, http.StatusUnauthorized, LoginResponse{Message: "Invalid credentials", Success: false})
		return
	}

	token, err := generateJWT(req.Username)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, LoginResponse{Message: "Error generating token", Success: false})
		return
	}

	sendJSON(w, http.StatusOK, LoginResponse{
		Token:    token,
		Username: req.Username,
		Message:  "Login successful",
		Success:  true,
	})
}

func handleWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		if auth := r.Header.Get("Authorization"); strings.HasPrefix(auth, "Bearer ") {
			token = strings.TrimPrefix(auth, "Bearer ")
		}
	}

	if token == "" {
		http.Error(w, "Authentication required", http.StatusUnauthorized)
		return
	}

	claims, err := validateJWT(token)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		conn:     conn,
		send:     make(chan Message, 256),
		username: claims.Username,
	}

	hub.register <- client
	go client.writePump()
	go client.readPump(hub)
}

func main() {
	initConfig()

	hub := newHub()
	go hub.run()

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/register", registerHandler)
	mux.HandleFunc("/api/login", loginHandler)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWebSocket(hub, w, r)
	})

	// Serve static files
	fs := http.FileServer(http.Dir("../frontend/"))
	mux.Handle("/", fs)

	log.Printf("Server starting on :%s", config.ServerPort)
	log.Printf("Access the app at: http://localhost:%s", config.ServerPort)
	log.Fatal(http.ListenAndServe(":"+config.ServerPort, mux))
}