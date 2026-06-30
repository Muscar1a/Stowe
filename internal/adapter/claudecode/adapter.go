package claudecode

import (
	"os"
	"os/exec"
	"path/filepath"
	"stowe/internal/model"
)

type Adapter struct{}

func New() *Adapter { return &Adapter{} }

func (a *Adapter) Discover() ([]string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}

	projectsDir := filepath.Join(home, ".claude", "projects")
	entries, err := os.ReadDir(projectsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var paths []string
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		projectDir := filepath.Join(projectsDir, entry.Name())
		files, err := os.ReadDir(projectDir)
		if err != nil {
			continue
		}
		for _, f := range files {
			if f.IsDir() {
				continue // skip UUID subdirectories (tool results)
			}
			if filepath.Ext(f.Name()) == ".jsonl" {
				paths = append(paths, filepath.Join(projectDir, f.Name()))
			}
		}
	}

	return paths, nil
}

func (a *Adapter) Parse(filePath string) (*model.Session, error) {
	return parse(filePath)
}

func (a *Adapter) BinaryPath() (string, error) {
	if path, err := exec.LookPath("claude"); err == nil {
		return path, nil
	}
	// fallback: check common install locations
	home, _ := os.UserHomeDir()
	candidates := []string{
		filepath.Join(home, ".local", "bin", "claude"),
		filepath.Join(home, ".local", "bin", "claude.exe"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c, nil
		}
	}
	return "claude", nil
}

func (a *Adapter) NewChatArgs(cwd string) []string {
	return []string{}
}

func (a *Adapter) ResumeChatArgs(sessionID string) []string {
	return []string{"--resume", sessionID}
}

func (a *Adapter) WatchDirs() []string {
	home, _ := os.UserHomeDir()
	return []string{filepath.Join(home, ".claude", "projects")}
}
