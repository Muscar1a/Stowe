package db

import (
	"stowe/internal/model"
	"time"
)

func (db *DB) UpsertSession(s *model.Session, fileMtime time.Time) error {
	_, err := db.Exec(`
		INSERT INTO sessions
			(id, agent_type, file_path, cwd, git_root, title, custom_name, is_favorite,
			 created_at, updated_at, message_count, git_branch, file_mtime)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
		ON CONFLICT(id) DO UPDATE SET
			file_path     = excluded.file_path,
			cwd           = excluded.cwd,
			git_root      = excluded.git_root,
			title         = excluded.title,
			updated_at    = excluded.updated_at,
			message_count = excluded.message_count,
			git_branch    = excluded.git_branch,
			file_mtime    = excluded.file_mtime
	`,
		s.ID, s.AgentType, s.FilePath, s.CWD, s.GitRoot, s.Title, s.CustomName,
		boolToInt(s.IsFavorite),
		s.CreatedAt.Format(time.RFC3339), s.UpdatedAt.Format(time.RFC3339),
		s.MessageCount, s.GitBranch, fileMtime.Format(time.RFC3339),
	)
	return err
}

func (db *DB) GetFileMtime(filePath string) (time.Time, bool) {
	var mtimeStr string
	err := db.QueryRow(`SELECT file_mtime FROM sessions WHERE file_path = ?`, filePath).Scan(&mtimeStr)
	if err != nil {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339, mtimeStr)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

func (db *DB) AllSessions() ([]model.Session, error) {
	rows, err := db.Query(`SELECT id, agent_type, file_path, cwd, git_root, title, custom_name,
		is_favorite, created_at, updated_at, message_count, git_branch
		FROM sessions ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSessions(rows)
}

func (db *DB) Search(query string) ([]model.Session, error) {
	rows, err := db.Query(`
		SELECT s.id, s.agent_type, s.file_path, s.cwd, s.git_root, s.title, s.custom_name,
		       s.is_favorite, s.created_at, s.updated_at, s.message_count, s.git_branch
		FROM sessions s
		JOIN sessions_fts f ON s.id = f.id
		WHERE sessions_fts MATCH ?
		ORDER BY s.updated_at DESC
	`, query+"*")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSessions(rows)
}

func (db *DB) SetCustomName(id, name string) error {
	_, err := db.Exec(`UPDATE sessions SET custom_name = ? WHERE id = ?`, name, id)
	return err
}

func (db *DB) ToggleFavorite(id string) error {
	_, err := db.Exec(`UPDATE sessions SET is_favorite = NOT is_favorite WHERE id = ?`, id)
	return err
}

func scanSessions(rows interface{ Next() bool; Scan(...any) error }) ([]model.Session, error) {
	var sessions []model.Session
	for rows.Next() {
		var s model.Session
		var isFav int
		var createdAt, updatedAt string
		if err := rows.Scan(&s.ID, &s.AgentType, &s.FilePath, &s.CWD, &s.GitRoot,
			&s.Title, &s.CustomName, &isFav, &createdAt, &updatedAt,
			&s.MessageCount, &s.GitBranch); err != nil {
			return nil, err
		}
		s.IsFavorite = isFav != 0
		s.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		s.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
