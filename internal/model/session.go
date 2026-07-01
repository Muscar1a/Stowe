package model

import "time"

type Message struct {
	UUID      string    `json:"uuid"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

type Session struct {
	ID           string    `json:"id"`
	AgentType    string    `json:"agentType"`
	FilePath     string    `json:"filePath"`
	CWD          string    `json:"cwd"`
	GitRoot      string    `json:"gitRoot"`
	Title        string    `json:"title"`
	CustomName   string    `json:"customName"`
	IsFavorite   bool      `json:"isFavorite"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	MessageCount int       `json:"messageCount"`
	GitBranch    string    `json:"gitBranch"`
}

type RepoGroup struct {
	GitRoot      string    `json:"gitRoot"`
	DisplayName  string    `json:"displayName"`
	Sessions     []Session `json:"sessions"`
	LastActivity time.Time `json:"lastActivity"`
}
