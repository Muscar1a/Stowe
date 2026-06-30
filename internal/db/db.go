package db

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
}

func Open(dataDir string) (*DB, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, err
	}

	dbPath := filepath.Join(dataDir, "stowe.db")
	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	if _, err := conn.Exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;`); err != nil {
		conn.Close()
		return nil, err
	}

	db := &DB{conn}
	if err := db.migrate(); err != nil {
		conn.Close()
		return nil, err
	}

	return db, nil
}

func (db *DB) migrate() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS sessions (
			id            TEXT PRIMARY KEY,
			agent_type    TEXT NOT NULL,
			file_path     TEXT NOT NULL UNIQUE,
			cwd           TEXT NOT NULL DEFAULT '',
			git_root      TEXT NOT NULL DEFAULT '',
			title         TEXT NOT NULL DEFAULT '',
			custom_name   TEXT NOT NULL DEFAULT '',
			is_favorite   INTEGER NOT NULL DEFAULT 0,
			created_at    TEXT NOT NULL,
			updated_at    TEXT NOT NULL,
			message_count INTEGER NOT NULL DEFAULT 0,
			git_branch    TEXT NOT NULL DEFAULT '',
			file_mtime    TEXT NOT NULL DEFAULT ''
		)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_git_root ON sessions(git_root)`,
		`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC)`,
		`CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
			id UNINDEXED,
			title,
			custom_name,
			git_root,
			content='sessions',
			content_rowid='rowid'
		)`,
		`CREATE TRIGGER IF NOT EXISTS sessions_ai AFTER INSERT ON sessions BEGIN
			INSERT INTO sessions_fts(rowid, id, title, custom_name, git_root)
			VALUES (new.rowid, new.id, new.title, new.custom_name, new.git_root);
		END`,
		`CREATE TRIGGER IF NOT EXISTS sessions_au AFTER UPDATE ON sessions BEGIN
			UPDATE sessions_fts SET title=new.title, custom_name=new.custom_name, git_root=new.git_root
			WHERE id=old.id;
		END`,
		`CREATE TRIGGER IF NOT EXISTS sessions_ad AFTER DELETE ON sessions BEGIN
			DELETE FROM sessions_fts WHERE id=old.id;
		END`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return err
		}
	}
	return nil
}
