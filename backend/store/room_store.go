package store

import (
	"sync"

	"chat-app/models"
)

// RoomStore manages chat rooms
type RoomStore struct {
	rooms map[string]*models.Room
	mu    sync.RWMutex
}

var Rooms = &RoomStore{rooms: make(map[string]*models.Room)}

func init() {
	// Create default general room
	Rooms.rooms["general"] = &models.Room{
		ID:      "general",
		Name:    "General",
		Members: []string{},
	}
}

func (s *RoomStore) Create(id, name string) *models.Room {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	room := &models.Room{
		ID:      id,
		Name:    name,
		Members: []string{},
	}
	s.rooms[id] = room
	return room
}

func (s *RoomStore) Get(id string) (*models.Room, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	room, exists := s.rooms[id]
	return room, exists
}

func (s *RoomStore) GetAll() []*models.Room {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	result := make([]*models.Room, 0, len(s.rooms))
	for _, room := range s.rooms {
		result = append(result, room)
	}
	return result
}

func (s *RoomStore) AddMember(roomID, username string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	room, exists := s.rooms[roomID]
	if !exists {
		return false
	}
	
	// Check if already a member
	for _, member := range room.Members {
		if member == username {
			return true
		}
	}
	
	room.Members = append(room.Members, username)
	return true
}

func (s *RoomStore) RemoveMember(roomID, username string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	room, exists := s.rooms[roomID]
	if !exists {
		return
	}
	
	for i, member := range room.Members {
		if member == username {
			room.Members = append(room.Members[:i], room.Members[i+1:]...)
			break
		}
	}
}

func (s *RoomStore) GetMembers(roomID string) []string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	room, exists := s.rooms[roomID]
	if !exists {
		return []string{}
	}
	
	members := make([]string, len(room.Members))
	copy(members, room.Members)
	return members
}