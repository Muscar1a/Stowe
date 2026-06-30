package watcher

import (
	"path/filepath"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"
)

type OnChangeFunc func(filePath string, isNew bool)

type Watcher struct {
	w        *fsnotify.Watcher
	onChange OnChangeFunc
	debounce map[string]*time.Timer
	mu       sync.Mutex
}

func New(onChange OnChangeFunc) *Watcher {
	return &Watcher{
		onChange: onChange,
		debounce: make(map[string]*time.Timer),
	}
}

func (w *Watcher) Start(dirs []string) error {
	fw, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	w.w = fw

	for _, dir := range dirs {
		if err := fw.Add(dir); err != nil {
			return err
		}
	}

	go w.run()
	return nil
}

func (w *Watcher) Stop() {
	if w.w != nil {
		w.w.Close()
	}
}

func (w *Watcher) run() {
	for {
		select {
		case event, ok := <-w.w.Events:
			if !ok {
				return
			}
			if filepath.Ext(event.Name) != ".jsonl" {
				continue
			}
			if event.Op&(fsnotify.Create|fsnotify.Write) == 0 {
				continue
			}
			isNew := event.Op&fsnotify.Create != 0
			w.scheduleUpdate(event.Name, isNew)

		case _, ok := <-w.w.Errors:
			if !ok {
				return
			}
		}
	}
}

func (w *Watcher) scheduleUpdate(path string, isNew bool) {
	w.mu.Lock()
	defer w.mu.Unlock()

	if t, ok := w.debounce[path]; ok {
		t.Stop()
	}
	w.debounce[path] = time.AfterFunc(150*time.Millisecond, func() {
		w.mu.Lock()
		delete(w.debounce, path)
		w.mu.Unlock()
		w.onChange(path, isNew)
	})
}
