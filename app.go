package main

import (
	"context"
	"os"
	"path/filepath"
	"stowe/internal/adapter"
	"stowe/internal/adapter/claudecode"
	"stowe/internal/db"
	"stowe/internal/model"
	"stowe/internal/pty"
	"stowe/internal/registry"
	"stowe/internal/watcher"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx       context.Context
	registry  *registry.Registry
	watcher   *watcher.Watcher
	ptyMgr    *pty.Manager
	ccAdapter *claudecode.Adapter
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	dataDir, _ := os.UserConfigDir()
	database, err := db.Open(filepath.Join(dataDir, "stowe"))
	if err != nil {
		runtime.LogErrorf(ctx, "db open error: %v", err)
		return
	}

	a.ccAdapter = claudecode.New()
	a.registry = registry.New(database, []adapter.AgentAdapter{a.ccAdapter})

	a.ptyMgr = pty.NewManager(func(event string, data any) {
		runtime.EventsEmit(ctx, event, data)
	})

	a.watcher = watcher.New(func(path string, isNew bool) {
		session, _, err := a.registry.UpdateFile(path)
		if err != nil || session == nil {
			return
		}
		event := "session:updated"
		if isNew {
			event = "session:new"
		}
		runtime.EventsEmit(ctx, event, session)
	})
	if err := a.watcher.Start(a.ccAdapter.WatchDirs()); err != nil {
		runtime.LogWarningf(ctx, "watcher start error: %v", err)
	}

	go func() {
		if err := a.registry.InitialScan(ctx); err != nil {
			runtime.LogErrorf(ctx, "initial scan error: %v", err)
			return
		}
		runtime.EventsEmit(ctx, "scan:complete", nil)
	}()
}

func (a *App) shutdown(ctx context.Context) {
	if a.watcher != nil {
		a.watcher.Stop()
	}
}

// === Data methods ===

func (a *App) GetRepoGroups() []model.RepoGroup {
	if a.registry == nil {
		return nil
	}
	return a.registry.GetRepoGroups()
}

func (a *App) Search(query string) []model.Session {
	if a.registry == nil || query == "" {
		return nil
	}
	results, _ := a.registry.Search(query)
	return results
}

// === Action methods ===

func (a *App) LaunchNewChat(gitRoot string) (string, error) {
	binary, err := a.ccAdapter.BinaryPath()
	if err != nil {
		return "", err
	}
	if gitRoot == "" {
		gitRoot, _ = os.UserHomeDir()
	}
	return a.ptyMgr.Start(a.ctx, binary, []string{}, gitRoot)
}

func (a *App) ResumeSession(sessionID string) (string, error) {
	binary, err := a.ccAdapter.BinaryPath()
	if err != nil {
		return "", err
	}
	args := a.ccAdapter.ResumeChatArgs(sessionID)

	dir := ""
	if s := a.registry.GetSession(sessionID); s != nil {
		dir = s.CWD
	}
	if dir == "" {
		dir, _ = os.UserHomeDir()
	}
	return a.ptyMgr.Start(a.ctx, binary, args, dir)
}

func (a *App) GetSessionMessages(sessionID string) []model.Message {
	s := a.registry.GetSession(sessionID)
	if s == nil {
		return nil
	}
	msgs, _ := a.ccAdapter.ParseMessages(s.FilePath)
	return msgs
}

func (a *App) WriteToTerminal(ptyID string, data string) {
	a.ptyMgr.Write(ptyID, []byte(data))
}

func (a *App) ResizeTerminal(ptyID string, cols, rows int) {
	a.ptyMgr.Resize(ptyID, uint16(cols), uint16(rows))
}

func (a *App) CloseTerminal(ptyID string) {
	a.ptyMgr.Close(ptyID)
}

// === Metadata methods ===

func (a *App) RenameSession(sessionID, name string) error {
	if err := a.registry.SetCustomName(sessionID, name); err != nil {
		return err
	}
	if s := a.registry.GetSession(sessionID); s != nil {
		runtime.EventsEmit(a.ctx, "session:updated", s)
	}
	return nil
}

func (a *App) DeleteSession(sessionID string) error {
	if err := a.registry.DeleteSession(sessionID); err != nil {
		return err
	}
	runtime.EventsEmit(a.ctx, "session:deleted", sessionID)
	return nil
}

func (a *App) ToggleFavorite(sessionID string) error {
	if err := a.registry.ToggleFavorite(sessionID); err != nil {
		return err
	}
	if s := a.registry.GetSession(sessionID); s != nil {
		runtime.EventsEmit(a.ctx, "session:updated", s)
	}
	return nil
}
