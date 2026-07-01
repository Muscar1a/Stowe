package claudecode

import (
	"bufio"
	"encoding/json"
	"os"
	"strings"
	"stowe/internal/model"
	"time"
)

type jsonRecord struct {
	Type        string       `json:"type"`
	UUID        string       `json:"uuid"`
	IsMeta      bool         `json:"isMeta"`
	IsSidechain bool         `json:"isSidechain"`
	Timestamp   string       `json:"timestamp"`
	Message     *jsonMessage `json:"message"`
}

type jsonMessage struct {
	Role    string          `json:"role"`
	Content json.RawMessage `json:"content"`
}

type contentBlock struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func (a *Adapter) ParseMessages(filePath string) ([]model.Message, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var messages []model.Message
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var rec jsonRecord
		if err := json.Unmarshal(line, &rec); err != nil {
			continue
		}

		if rec.Type != "user" && rec.Type != "assistant" {
			continue
		}
		if rec.IsMeta || rec.IsSidechain {
			continue
		}
		if rec.Message == nil {
			continue
		}

		content := extractContent(rec.Message)
		if content == "" {
			continue
		}

		var ts time.Time
		if rec.Timestamp != "" {
			if t, err := time.Parse(time.RFC3339Nano, rec.Timestamp); err == nil {
				ts = t
			} else if t, err := time.Parse(time.RFC3339, rec.Timestamp); err == nil {
				ts = t
			}
		}

		messages = append(messages, model.Message{
			UUID:      rec.UUID,
			Role:      rec.Message.Role,
			Content:   content,
			Timestamp: ts,
		})
	}

	return messages, scanner.Err()
}

func extractContent(msg *jsonMessage) string {
	// User messages: content is a plain string
	var s string
	if err := json.Unmarshal(msg.Content, &s); err == nil {
		s = strings.TrimSpace(s)
		if s == "" || s[0] == '<' {
			return ""
		}
		return s
	}

	// Assistant messages: content is an array of typed blocks
	var blocks []contentBlock
	if err := json.Unmarshal(msg.Content, &blocks); err == nil {
		var parts []string
		for _, b := range blocks {
			if b.Type == "text" && strings.TrimSpace(b.Text) != "" {
				parts = append(parts, b.Text)
			}
		}
		return strings.Join(parts, "\n")
	}

	return ""
}
