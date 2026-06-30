package pty

import (
	"context"
	"io"
	"sync"

	"github.com/google/uuid"
)

type EmitFunc func(event string, data any)

type session struct {
	id     string
	p      *platformPTY
	cancel context.CancelFunc
}

type Manager struct {
	mu       sync.Mutex
	sessions map[string]*session
	emit     EmitFunc
}

func NewManager(emit EmitFunc) *Manager {
	return &Manager{
		sessions: make(map[string]*session),
		emit:     emit,
	}
}

type PTYData struct {
	ID   string `json:"id"`
	Data string `json:"data"`
}

type PTYExit struct {
	ID   string `json:"id"`
	Code int    `json:"code"`
}

func (m *Manager) Start(ctx context.Context, binary string, args []string, dir string) (string, error) {
	id := uuid.New().String()
	sctx, cancel := context.WithCancel(ctx)

	p, err := newPlatformPTY(sctx, 120, 30, binary, args, dir)
	if err != nil {
		cancel()
		return "", err
	}

	s := &session{id: id, p: p, cancel: cancel}
	m.mu.Lock()
	m.sessions[id] = s
	m.mu.Unlock()

	go m.readLoop(s)
	return id, nil
}

func (m *Manager) Write(id string, data []byte) error {
	m.mu.Lock()
	s, ok := m.sessions[id]
	m.mu.Unlock()
	if !ok {
		return nil
	}
	_, err := s.p.Write(data)
	return err
}

func (m *Manager) Resize(id string, cols, rows uint16) error {
	m.mu.Lock()
	s, ok := m.sessions[id]
	m.mu.Unlock()
	if !ok {
		return nil
	}
	return s.p.Resize(cols, rows)
}

func (m *Manager) Close(id string) {
	m.mu.Lock()
	s, ok := m.sessions[id]
	if ok {
		delete(m.sessions, id)
	}
	m.mu.Unlock()
	if ok {
		s.cancel()
		s.p.Close()
	}
}

func (m *Manager) readLoop(s *session) {
	buf := make([]byte, 4096)
	for {
		n, err := s.p.Read(buf)
		if n > 0 {
			m.emit("pty:data", PTYData{ID: s.id, Data: string(buf[:n])})
		}
		if err != nil {
			if err != io.EOF {
				// process exited
			}
			break
		}
	}
	m.emit("pty:exit", PTYExit{ID: s.id, Code: 0})
	m.Close(s.id)
}
