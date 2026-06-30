package git

import (
	"os"
	"path/filepath"
)

// FindRoot walks up from startPath looking for a .git directory.
// Returns startPath itself if no git root is found.
func FindRoot(startPath string) string {
	current := startPath
	for {
		if _, err := os.Stat(filepath.Join(current, ".git")); err == nil {
			return current
		}
		parent := filepath.Dir(current)
		if parent == current {
			return startPath
		}
		current = parent
	}
}
