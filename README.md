# Stowe 🧳

[![Go Version](https://img.shields.io/github/go-mod/go-version/Muscar1a/Stowe?color=00ADD8&logo=go)](https://golang.org)
[![Wails Version](https://img.shields.io/badge/Wails-v2.x-red?logo=wails&logoColor=white)](https://wails.io/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Stowe** is a lightweight desktop manager that organizes and resumes your **Claude Code** CLI sessions inside a clean, repository-centric visual interface. Instead of dealing with multiple scattered terminal sessions, Stowe automatically scans, tracks, and groups your active and historical coding sessions under their corresponding Git repositories.

Built on Go + Wails, Stowe uses the native system webview to run fast and consume minimal resources (~30-50MB RAM idle).

---

## ✨ Features

* **Automated Repo-Centric Grouping**: Automatically resolves the Git root directory for each session and groups them on the UI Sidebar. It displays the active `git branch` and message count for each session.
* **Claude Code CLI Adapter**: Auto-discovers existing Claude Code sessions (from `~/.claude/projects/`) and parses JSONL logs to extract metadata and titles.
* **Cross-Platform PTY Terminal**: Run and resume sessions in a multi-tab terminal emulator powered by **xterm.js**. It uses native `ConPTY` on Windows and `creack/pty` on macOS/Linux for interactive CLI compatibility.
* **Real-Time Sync**: Uses a debounced `fsnotify` watcher to monitor log directories, instantly syncing new and updated sessions as you type in your external terminal.
* **SQLite Cache with FTS5**: Caches metadata in a local CGO-free SQLite database. Uses full-text search (`fts5`) for instant search across repos, custom titles, and session titles.
* **Modern UI/UX**: Built with React 19 and Tailwind CSS v4, supporting live search, session favoriting (starring), and double-click inline renaming.

---

## 📂 Project Structure

```text
stowe/
├── main.go               # Go entry point (Wails launcher)
├── app.go                # Wails App definition & event/action bindings (Go ↔ JS)
├── internal/             # Go Backend source code
│   ├── model/            # Data models (Session, RepoGroup)
│   ├── adapter/          # Unified adapter interfaces and parsers (e.g., Claude Code)
│   ├── db/               # SQLite database client, WAL configurations, FTS5 & triggers
│   ├── git/              # Git repository resolution utilities
│   ├── registry/         # Log scanner registry and SQLite cache coordinator
│   ├── watcher/          # fsnotify wrapper monitoring session logs
│   └── pty/              # PTY manager supporting Windows (ConPTY) & Unix (creack/pty)
└── frontend/             # Frontend React app (Vite + TS + Tailwind v4)
    └── src/
        ├── App.tsx       # Main layout and tab state manager
        ├── components/   # UI Components (Sidebar, SessionCard, TerminalPane, etc.)
        └── hooks/        # React hooks for PTY data piping and session updates
```

---

## 🚦 Getting Started

### Prerequisites
* **Go** 1.21 or higher
* **Node.js** v18+ & **npm**
* **Wails CLI** v2.x (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)
* **GCC compiler** (Only on Windows, required for system PTY integration. Run `wails doctor` to verify).

### Run in Development Mode
Execute this command in the root folder to start Stowe with hot-reload enabled for both the Go backend and React frontend:
```bash
wails dev
```

### Build Executable
To package Stowe into a single optimized binary for your operating system:
```bash
wails build
```

---

## 📄 License
This project is licensed under the **MIT License**. See the `LICENSE` file for details.
