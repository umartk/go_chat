package websocket

import (
	"log"
	"sync"

	"chat-app/models"
	"chat-app/store"
)

type Hub struct {
	Clients       map[*Client]bool
	ClientsByUser map[string]*Client
	Broadcast     chan models.Message
	Register      chan *Client
	Unregister    chan *Client
	mu            sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Clients:       make(map[*Client]bool),
		ClientsByUser: make(map[string]*Client),
		Broadcast:     make(chan models.Message),
		Register:      make(chan *Client),
		Unregister:    make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.handleRegister(client)

		case client := <-h.Unregister:
			h.handleUnregister(client)

		case message := <-h.Broadcast:
			h.handleBroadcast(message)
		}
	}
}

func (h *Hub) handleRegister(client *Client) {
	h.mu.Lock()
	h.Clients[client] = true
	h.ClientsByUser[client.Username] = client
	h.mu.Unlock()

	log.Printf("Client %s connected. Total: %d", client.Username, len(h.Clients))

	// Add to general room
	store.Rooms.AddMember("general", client.Username)

	// Send user list to new client
	h.sendUserList(client)

	// Notify others about new user (so they can share the room key)
	h.notifyUserJoined(client.Username)
}

func (h *Hub) handleUnregister(client *Client) {
	h.mu.Lock()
	if _, ok := h.Clients[client]; ok {
		delete(h.Clients, client)
		delete(h.ClientsByUser, client.Username)
		close(client.Send)
	}
	h.mu.Unlock()

	store.Rooms.RemoveMember("general", client.Username)

	log.Printf("Client %s disconnected. Total: %d", client.Username, len(h.Clients))

	h.notifyUserLeft(client.Username)
}

func (h *Hub) handleBroadcast(message models.Message) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.Clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.Clients, client)
		}
	}
}

func (h *Hub) SendToUser(username string, message models.Message) {
	h.mu.RLock()
	client, exists := h.ClientsByUser[username]
	h.mu.RUnlock()

	if exists {
		select {
		case client.Send <- message:
		default:
		}
	}
}

func (h *Hub) sendUserList(client *Client) {
	h.mu.RLock()
	users := make([]map[string]interface{}, 0)

	for _, c := range h.ClientsByUser {
		users = append(users, map[string]interface{}{
			"username": c.Username,
		})
	}
	h.mu.RUnlock()

	msg := models.Message{
		Type: models.MsgTypeUserList,
		Data: map[string]interface{}{
			"users": users,
		},
	}

	select {
	case client.Send <- msg:
	default:
	}
}

func (h *Hub) notifyUserJoined(username string) {
	msg := models.Message{
		Type:     models.MsgTypeSystem,
		Username: username,
		RoomID:   "general",
		Content:  username + " joined the chat",
		Data: map[string]interface{}{
			"event": "user_joined",
		},
	}

	h.mu.RLock()
	for client := range h.Clients {
		if client.Username != username {
			select {
			case client.Send <- msg:
			default:
			}
		}
	}
	h.mu.RUnlock()
}

func (h *Hub) notifyUserLeft(username string) {
	msg := models.Message{
		Type:     models.MsgTypeSystem,
		Username: username,
		Content:  username + " left the chat",
		Data: map[string]interface{}{
			"event": "user_left",
		},
	}

	h.mu.RLock()
	for client := range h.Clients {
		select {
		case client.Send <- msg:
		default:
		}
	}
	h.mu.RUnlock()
}