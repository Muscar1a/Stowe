package claudecode

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"stowe/internal/git"
	"stowe/internal/model"
	"time"
)

func parse(filePath string) (*model.Session, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var (
		cwd         string
		gitBranch   string
		customTitle string
		aiTitle     string
		lastPrompt  string
		createdAt   time.Time
		updatedAt   time.Time
		msgCount    int
	)

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

	for scanner.Scan() {
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}

		var rec map[string]any
		if err := json.Unmarshal(line, &rec); err != nil {
			continue
		}

		recType, _ := rec["type"].(string)

		// Collect timestamps from any record that has one
		if ts := parseTimestamp(rec); !ts.IsZero() {
			if createdAt.IsZero() || ts.Before(createdAt) {
				createdAt = ts
			}
			if ts.After(updatedAt) {
				updatedAt = ts
			}
		}

		switch recType {
		case "custom-title":
			customTitle, _ = rec["customTitle"].(string)
		case "ai-title":
			aiTitle, _ = rec["aiTitle"].(string)
		case "last-prompt":
			lastPrompt, _ = rec["lastPrompt"].(string)
		case "user", "assistant", "system":
			if cwd == "" {
				cwd, _ = rec["cwd"].(string)
			}
			if gitBranch == "" {
				gitBranch, _ = rec["gitBranch"].(string)
			}
			if recType == "user" || recType == "assistant" {
				msgCount++
			}
		}
	}

	// Derive session ID from filename
	base := filepath.Base(filePath)
	id := base[:len(base)-len(filepath.Ext(base))]

	// Title priority: custom-title > ai-title > last-prompt > fallback
	title := customTitle
	if title == "" {
		title = aiTitle
	}
	if title == "" {
		title = lastPrompt
	}
	if title == "" {
		title = "Session " + createdAt.Format("2006-01-02")
	}

	if createdAt.IsZero() {
		info, _ := os.Stat(filePath)
		if info != nil {
			createdAt = info.ModTime()
			updatedAt = info.ModTime()
		}
	}

	gitRoot := git.FindRoot(cwd)

	return &model.Session{
		ID:           id,
		AgentType:    "claude_code",
		FilePath:     filePath,
		CWD:          cwd,
		GitRoot:      gitRoot,
		Title:        title,
		MessageCount: msgCount,
		GitBranch:    gitBranch,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}, nil
}

func parseTimestamp(rec map[string]any) time.Time {
	for _, key := range []string{"timestamp", "ts", "createdAt", "updatedAt"} {
		if v, ok := rec[key]; ok {
			switch s := v.(type) {
			case string:
				if t, err := time.Parse(time.RFC3339, s); err == nil {
					return t
				}
				if t, err := time.Parse(time.RFC3339Nano, s); err == nil {
					return t
				}
			case float64:
				return time.UnixMilli(int64(s))
			}
		}
	}
	return time.Time{}
}
