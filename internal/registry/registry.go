package registry

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"stowe/internal/adapter"
	"stowe/internal/db"
	"stowe/internal/model"
	"sync"
)

type Registry struct {
	db       *db.DB
	adapters []adapter.AgentAdapter
	mu       sync.RWMutex
	cache    map[string]*model.Session
}

func New(database *db.DB, adapters []adapter.AgentAdapter) *Registry {
	return &Registry{
		db:       database,
		adapters: adapters,
		cache:    make(map[string]*model.Session),
	}
}

func (r *Registry) InitialScan(ctx context.Context) error {
	type workItem struct {
		adapter  adapter.AgentAdapter
		filePath string
	}

	var items []workItem
	for _, a := range r.adapters {
		paths, err := a.Discover()
		if err != nil {
			continue
		}
		for _, p := range paths {
			items = append(items, workItem{a, p})
		}
	}

	const workers = 4
	ch := make(chan workItem, len(items))
	for _, item := range items {
		ch <- item
	}
	close(ch)

	var wg sync.WaitGroup
	var mu sync.Mutex

	for range workers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for item := range ch {
				if ctx.Err() != nil {
					return
				}

				info, err := os.Stat(item.filePath)
				if err != nil {
					continue
				}
				mtime := info.ModTime()

				// skip if file unchanged since last index
				if cached, ok := r.db.GetFileMtime(item.filePath); ok {
					if !mtime.After(cached) {
						continue
					}
				}

				session, err := item.adapter.Parse(item.filePath)
				if err != nil {
					continue
				}

				if err := r.db.UpsertSession(session, mtime); err != nil {
					continue
				}

				mu.Lock()
				r.cache[session.ID] = session
				mu.Unlock()
			}
		}()
	}
	wg.Wait()

	// Load everything from DB into cache (includes previously indexed sessions)
	all, err := r.db.AllSessions()
	if err != nil {
		return err
	}
	r.mu.Lock()
	for i := range all {
		r.cache[all[i].ID] = &all[i]
	}
	r.mu.Unlock()

	return nil
}

// UpdateFile re-parses a single file and updates DB + cache.
// Returns the session and whether it is newly created.
func (r *Registry) UpdateFile(filePath string) (*model.Session, bool, error) {
	var targetAdapter adapter.AgentAdapter
	for _, a := range r.adapters {
		for _, dir := range a.WatchDirs() {
			if isUnder(filePath, dir) {
				targetAdapter = a
				break
			}
		}
		if targetAdapter != nil {
			break
		}
	}
	if targetAdapter == nil {
		return nil, false, nil
	}

	info, err := os.Stat(filePath)
	if err != nil {
		return nil, false, err
	}

	session, err := targetAdapter.Parse(filePath)
	if err != nil {
		return nil, false, err
	}

	r.mu.Lock()
	_, isNew := r.cache[session.ID]
	isNew = !isNew
	r.cache[session.ID] = session
	r.mu.Unlock()

	if err := r.db.UpsertSession(session, info.ModTime()); err != nil {
		return nil, false, err
	}

	return session, isNew, nil
}

func (r *Registry) GetRepoGroups() []model.RepoGroup {
	r.mu.RLock()
	defer r.mu.RUnlock()

	groups := make(map[string]*model.RepoGroup)
	for _, s := range r.cache {
		g, ok := groups[s.GitRoot]
		if !ok {
			g = &model.RepoGroup{
				GitRoot:     s.GitRoot,
				DisplayName: filepath.Base(s.GitRoot),
			}
			groups[s.GitRoot] = g
		}
		g.Sessions = append(g.Sessions, *s)
		if s.UpdatedAt.After(g.LastActivity) {
			g.LastActivity = s.UpdatedAt
		}
	}

	result := make([]model.RepoGroup, 0, len(groups))
	for _, g := range groups {
		sortSessions(g.Sessions)
		result = append(result, *g)
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i].LastActivity.After(result[j].LastActivity)
	})
	return result
}

func (r *Registry) GetSession(id string) *model.Session {
	r.mu.RLock()
	defer r.mu.RUnlock()
	s, ok := r.cache[id]
	if !ok {
		return nil
	}
	copy := *s
	return &copy
}

func (r *Registry) Search(query string) ([]model.Session, error) {
	return r.db.Search(query)
}

func (r *Registry) SetCustomName(id, name string) error {
	if err := r.db.SetCustomName(id, name); err != nil {
		return err
	}
	r.mu.Lock()
	if s, ok := r.cache[id]; ok {
		s.CustomName = name
	}
	r.mu.Unlock()
	return nil
}

// DeleteSession removes a session from DB and cache, and deletes its file on
// disk — otherwise the next scan would re-index it.
func (r *Registry) DeleteSession(id string) error {
	r.mu.Lock()
	s, ok := r.cache[id]
	delete(r.cache, id)
	r.mu.Unlock()

	if err := r.db.DeleteSession(id); err != nil {
		return err
	}
	if ok && s.FilePath != "" {
		if err := os.Remove(s.FilePath); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return nil
}

func (r *Registry) ToggleFavorite(id string) error {
	if err := r.db.ToggleFavorite(id); err != nil {
		return err
	}
	r.mu.Lock()
	if s, ok := r.cache[id]; ok {
		s.IsFavorite = !s.IsFavorite
	}
	r.mu.Unlock()
	return nil
}

func sortSessions(sessions []model.Session) {
	sort.Slice(sessions, func(i, j int) bool {
		if sessions[i].IsFavorite != sessions[j].IsFavorite {
			return sessions[i].IsFavorite
		}
		return sessions[i].UpdatedAt.After(sessions[j].UpdatedAt)
	})
}

func isUnder(path, dir string) bool {
	rel, err := filepath.Rel(dir, path)
	if err != nil {
		return false
	}
	return len(rel) > 0 && rel[0] != '.'
}
