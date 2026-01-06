package websocket

import (
	"log"
	"time"

	"chat-app/models"
	"chat-app/store"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn     *websocket.Conn
	Send     chan models.Message
	Username string
	Hub      *Hub
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg models.Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		msg.Username = c.Username
		msg.Timestamp = time.Now()
		msg.RoomID = "general"

		c.handleMessage(msg)
	}
}

func (c *Client) handleMessage(msg models.Message) {
	switch msg.Type {
	case models.MsgTypeChat:
		c.Hub.Broadcast <- msg

	case models.MsgTypeRoomKey:
		// Forward room key to specific recipient
		c.Hub.SendToUser(msg.Recipient, msg)

	case models.MsgTypeRequestKey:
		// Broadcast key request to all users
		c.handleKeyRequest(msg)

	default:
		c.Hub.Broadcast <- msg
	}
}

func (c *Client) handleKeyRequest(msg models.Message) {
	request := models.Message{
		Type:     models.MsgTypeRequestKey,
		RoomID:   "general",
		Username: c.Username,
	}

	members := store.Rooms.GetMembers("general")
	for _, member := range members {
		if member != c.Username {
			c.Hub.SendToUser(member, request)
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}