package claudecode

import (
	"bufio"
	"encoding/json"
	"os"
	"stowe/internal/model"
	"strings"
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

func (a *Adapter) ParseEditedFiles(filePath string) ([]string, error) {
	scanner, f, err := openScanner(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	type toolInput struct {
		FilePath string `json:"file_path"`
	}
	type toolBlock struct {
		Type  string    `json:"type"`
		Name  string    `json:"name"`
		Input toolInput `json:"input"`
	}

	seen := make(map[string]bool)
	var files []string

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var rec jsonRecord
		if err := json.Unmarshal(line, &rec); err != nil {
			continue
		}
		if rec.Type != "assistant" || rec.IsMeta || rec.IsSidechain || rec.Message == nil {
			continue
		}
		var blocks []toolBlock
		if err := json.Unmarshal(rec.Message.Content, &blocks); err != nil {
			continue
		}
		for _, b := range blocks {
			if b.Type != "tool_use" {
				continue
			}
			switch b.Name {
			case "Write", "Edit", "MultiEdit", "NotebookEdit":
				if p := b.Input.FilePath; p != "" && !seen[p] {
					seen[p] = true
					files = append(files, p)
				}
			}
		}
	}
	return files, scanner.Err()
}

func (a *Adapter) ParseMessages(filePath string) ([]model.Message, error) {
	scanner, f, err := openScanner(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var messages []model.Message

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

func openScanner(path string) (*bufio.Scanner, *os.File, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, nil, err
	}
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	return sc, f, nil
}
