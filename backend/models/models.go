package models

import "time"

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

// WebSocket Message Types
const (
	MsgTypeChat       = "chat"
	MsgTypeRoomKey    = "room_key"
	MsgTypeRequestKey = "request_key"
	MsgTypeUserList   = "user_list"
	MsgTypeSystem     = "system"
)

type Message struct {
	Type      string                 `json:"type"`
	Content   string                 `json:"content,omitempty"`
	Username  string                 `json:"username,omitempty"`
	Recipient string                 `json:"recipient,omitempty"`
	RoomID    string                 `json:"roomId,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
	Encrypted *EncryptedData         `json:"encrypted,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

type EncryptedData struct {
	Ciphertext string `json:"ciphertext"`
	IV         string `json:"iv"`
	KeyID      string `json:"keyId,omitempty"`
}

type Room struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Members []string `json:"members"`
}