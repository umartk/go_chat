package store

import (
	"os"
	"sync"

	"chat-app/auth"
)

type UserStore struct {
	users map[string]string
	mu    sync.RWMutex
}

var Users = &UserStore{users: make(map[string]string)}

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

func InitDefaultUsers() {
	adminUser := getEnv("DEFAULT_ADMIN_USER", "admin")
	adminPass := getEnv("DEFAULT_ADMIN_PASSWORD", "password")
	defaultUser := getEnv("DEFAULT_USER", "user1")
	defaultPass := getEnv("DEFAULT_USER_PASSWORD", "password")

	if hash, err := auth.HashPassword(adminPass); err == nil {
		Users.Set(adminUser, hash)
	}
	if hash, err := auth.HashPassword(defaultPass); err == nil {
		Users.Set(defaultUser, hash)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}