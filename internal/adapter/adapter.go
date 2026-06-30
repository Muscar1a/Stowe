package adapter

import "stowe/internal/model"

type AgentAdapter interface {
	Discover() ([]string, error)
	Parse(filePath string) (*model.Session, error)
	BinaryPath() (string, error)
	NewChatArgs(cwd string) []string
	ResumeChatArgs(sessionID string) []string
	WatchDirs() []string
}
