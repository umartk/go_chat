package handlers

import (
	"encoding/json"
	"net/http"

	"chat-app/auth"
	"chat-app/models"
	"chat-app/store"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, models.LoginResponse{Message: "Method not allowed", Success: false})
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, models.LoginResponse{Message: "Invalid request", Success: false})
		return
	}

	if req.Username == "" || req.Password == "" {
		sendJSON(w, http.StatusBadRequest, models.LoginResponse{Message: "Username and password required", Success: false})
		return
	}

	if len(req.Username) < 3 || len(req.Password) < 6 {
		sendJSON(w, http.StatusBadRequest, models.LoginResponse{Message: "Username min 3 chars, password min 6 chars", Success: false})
		return
	}

	if store.Users.Exists(req.Username) {
		sendJSON(w, http.StatusConflict, models.LoginResponse{Message: "Username already exists", Success: false})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, models.LoginResponse{Message: "Error creating user", Success: false})
		return
	}

	store.Users.Set(req.Username, hash)

	token, err := auth.GenerateJWT(req.Username)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, models.LoginResponse{Message: "Error generating token", Success: false})
		return
	}

	sendJSON(w, http.StatusCreated, models.LoginResponse{
		Token:    token,
		Username: req.Username,
		Message:  "Registration successful",
		Success:  true,
	})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		sendJSON(w, http.StatusMethodNotAllowed, models.LoginResponse{Message: "Method not allowed", Success: false})
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendJSON(w, http.StatusBadRequest, models.LoginResponse{Message: "Invalid request", Success: false})
		return
	}

	hash, exists := store.Users.Get(req.Username)
	if !exists || !auth.CheckPasswordHash(req.Password, hash) {
		sendJSON(w, http.StatusUnauthorized, models.LoginResponse{Message: "Invalid credentials", Success: false})
		return
	}

	token, err := auth.GenerateJWT(req.Username)
	if err != nil {
		sendJSON(w, http.StatusInternalServerError, models.LoginResponse{Message: "Error generating token", Success: false})
		return
	}

	sendJSON(w, http.StatusOK, models.LoginResponse{
		Token:    token,
		Username: req.Username,
		Message:  "Login successful",
		Success:  true,
	})
}