# Kế hoạch thiết kế: Ứng dụng quản lý chat đa-agent theo repo

## 1. Mục tiêu sản phẩm

Desktop app quản lý các phiên chat của CLI coding agent (Claude Code, Codex CLI, Gemini CLI, Antigravity CLI) và agent dùng API key tự thêm, tổ chức theo repo, cho phép xem lại, tiếp tục, và khởi tạo chat mới — nhẹ hơn và outperform các giải pháp hiện có (Opcode, Nimbalyst, CloudCLI).

## 2. Quyết định kỹ thuật đã chốt

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Framework desktop | Go + Wails | Webview hệ thống (không nhúng Chromium như Electron) → nhẹ, RAM thấp; Go phù hợp viết nhiều adapter parser khác định dạng nhanh hơn Rust |
| Vì sao không Electron | Loại trừ | Đóng gói cả Chromium + Node runtime → app nặng (100-200MB+), tốn RAM (150-300MB chỉ để chạy rỗng) |
| Vì sao không Rust + Tauri (dù phổ biến nhất) | Cân nhắc nhưng không chọn | Go viết nhanh hơn cho việc liên tục thêm/sửa adapter parser khi định dạng CLI agent thay đổi; interface của Go hợp tự nhiên với pattern "mỗi agent = 1 implementation chung interface" |
| Lưu trữ index | SQLite (nhúng, pure Go, không cần cgo — `modernc.org/sqlite`) | Chỉ là cache/index của session đã chuẩn hóa, không phải nguồn sự thật — nguồn gốc vẫn là file CLI ghi ra. Hỗ trợ query lọc/search nhanh mà không cần parse lại file gốc mỗi lần |
| Đồng bộ dữ liệu | File watcher (fsnotify), chỉ re-index file thay đổi | Tránh giật lag khi số session tăng, tránh quét toàn bộ mỗi lần mở app |
| Terminal nhúng | xterm.js (frontend) + creack/pty (Go backend) | Cần vì CLI agent là TUI tương tác (curses-based), không thể chạy ngầm đọc stdout thông thường |
| Lưu API key | OS keychain (`zalando/go-keyring`), không lưu plaintext | Bảo mật, tương thích macOS Keychain / Windows Credential Manager / Linux Secret Service |
| CSS | Tailwind CSS | Nhanh khi build UI, không dùng UI library nặng (MUI, Chakra) |

## 3. Kiến trúc 2 luồng song song

### Luồng A — CLI Watcher & Launcher
**Agent:** Claude Code, Codex CLI, Gemini CLI, Antigravity CLI

- App đóng vai trò observer + launcher, không tự chat
- Đọc/parse file session do từng CLI tự ghi ra (định dạng khác nhau giữa các agent, có agent còn đổi định dạng theo thời gian — ví dụ Antigravity đang chuyển từ JSONL sang SQLite làm định dạng conversation chính thức)
- Hỗ trợ cả **resume session cũ** lẫn **khởi tạo chat mới**, đều thông qua terminal nhúng (PTY) vì các CLI này là TUI tương tác, không phải one-shot command
- File watcher tự phát hiện session mới sinh ra sau khi launch (CLI tool tự sinh session ID, app không control được ID này), gắn vào registry và map đúng repo

### Luồng B — API Chat tự build
**Agent:** bất kỳ agent nào dùng API key người dùng tự thêm (OpenAI, Anthropic, Google...)

- App là client chủ động, tự gọi LLM API trực tiếp, tự lưu lịch sử chat trong SQLite riêng của app (app là nguồn sự thật, không phải file ngoài)
- Giao diện chat tự build trong app (streaming response, markdown + code block rendering) — không thông qua terminal
- Giai đoạn đầu: **chỉ chat thuần, không tool-calling/sandbox** — tránh phải tự xây lại toàn bộ "agent harness" (tool execution, permission, sandbox) — khối lượng công việc tương đương xây lại một phần Claude Code/Codex, cần đánh giá riêng nếu mở rộng sau này

Cả 2 luồng đổ chung vào 1 `SessionRegistry` chuẩn hóa, hiển thị gộp theo repo trên cùng giao diện, nhưng hành vi tương tác khác nhau theo nguồn gốc session (CLI session → mở terminal; API session → mở chat panel).

## 4. Tổ chức theo repo

Map session → repo dựa trên đường dẫn làm việc (cwd) ghi nhận lúc tạo session — dùng chung logic xác định git root cho mọi loại agent và mọi nguồn (CLI lẫn API), đảm bảo nhất quán dù dữ liệu gốc khác định dạng.

## 5. Adapter pattern bắt buộc

Vì mỗi CLI agent lưu dữ liệu khác nhau và có thể thay đổi định dạng theo thời gian, bắt buộc thiết kế theo interface chuẩn cho từng agent, tối thiểu gồm:

- Tự phát hiện (discover) session đã có
- Parse session về model dữ liệu chuẩn hóa chung
- Xác định đường dẫn binary thực thi (có thể tự dò trong PATH hoặc cho người dùng cấu hình)
- Tham số khởi tạo chat mới
- Tham số resume session cũ

Core app không phụ thuộc vào định dạng cụ thể của bất kỳ agent nào — thêm agent mới hoặc agent đổi định dạng chỉ cần sửa/thêm 1 adapter, không ảnh hưởng phần còn lại của hệ thống.

## 6. Bảng nguồn dữ liệu các CLI agent

| Agent | Vị trí lưu | Format | Ghi chú |
|---|---|---|---|
| Claude Code | `~/.claude/projects/<encoded-path>/<id>.jsonl` | JSONL phẳng | Tương đối ổn định |
| Codex CLI | `~/.codex/sessions/` | rollout files (dạng JSONL) | Cần kiểm tra kỹ định dạng cụ thể khi build adapter |
| Antigravity CLI | `~/.gemini/antigravity-cli/brain/<conversation-id>/` | Đang chuyển từ JSONL (`transcript.jsonl`) sang SQLite (`.db`, `.db-wal`) làm định dạng chính thức | Adapter cần đọc được cả 2 định dạng, ưu tiên `.db` nếu có, fallback JSONL |

### Dữ liệu thực tế Claude Code (đã xác minh)

Cấu trúc thư mục thực:
```
~/.claude/projects/
  E--SideProject-Stowe/
    6c82380f-be4b-4543-90c7-82c44f70757f.jsonl   ← session file
    6c82380f-be4b-4543-90c7-82c44f70757f/         ← tool results (bỏ qua)
  E--Uni-BigProject/
    066ac4ea-5024-4ab2-bc55-8df8c6e73e43.jsonl
    ...
```

Record types có trong JSONL: `mode`, `permission-mode`, `file-history-snapshot`, `user`, `assistant`, `system`, `last-prompt`, `ai-title`, `custom-title`, `agent-name`, `attachment`, `queue-operation`

Nguồn title theo thứ tự ưu tiên: `custom-title` > `ai-title` > `last-prompt` > `"Session <date>"`

Binary path: `C:\Users\ROG\.local\bin\claude.exe`  
Resume flag: `claude --resume <sessionID>`

**Discover filter quan trọng**: Trong mỗi project dir có cả `.jsonl` file và thư mục con cùng tên UUID. Chỉ lấy file `.jsonl` nằm trực tiếp trong project dir, bỏ qua subdir.

## 7. Roadmap theo giai đoạn

| Giai đoạn | Phạm vi |
|---|---|
| V1 — MVP | Luồng A, chỉ Claude Code: discover, nhóm theo repo, resume + tạo chat mới qua terminal nhúng, search, đặt tên/favorite |
| V2 | Mở rộng adapter: Codex CLI, Gemini CLI, Antigravity CLI (xử lý cả định dạng cũ/mới); track token/cost per session nếu agent có log usage |
| V3 | Luồng B: quản lý API key qua OS keychain, validate key, chat UI streaming + markdown render, lưu lịch sử riêng trong SQLite của app |
| V4 | Diff viewer (file đã thay đổi trong session), git worktree isolation cho luồng A, kanban view xuyên agent, dashboard usage/cost tổng hợp |
| V5 (mở, chưa cam kết) | Tool-calling/sandbox cho luồng B nếu thực sự cần — đánh giá kỹ trước vì khối lượng công việc rất lớn |

## 8. Tính năng theo xu thế 2026 (tham khảo bổ sung cho roadmap)

- Token/cost tracking theo session và theo repo — đã trở thành chuẩn ở các tool dẫn đầu (amux, agenttrace, Opcode)
- Quan sát ở mức tool-call: theo dõi lỗi tool, hành vi bất thường, không chỉ xem lại đoạn chat
- Git worktree isolation gần như bắt buộc khi chạy nhiều agent song song trên cùng repo
- Kanban/task board xuyên agent — mỗi session như 1 thẻ task, trạng thái rõ ràng (todo/running/review/done)
- Watchdog tự phục hồi khi agent treo hoặc crash
- Mobile companion / dashboard PWA để theo dõi session từ xa
- Ghi chú/tag gắn theo repo (không chỉ theo session) để giữ context dự án qua thời gian

## 9. Rủi ro cần theo dõi

- Định dạng lưu trữ của các CLI agent có thể đổi bất cứ lúc nào (đã quan sát thấy với Antigravity CLI) → adapter cần dễ sửa, không hard-code giả định cấu trúc file
- Terminal nhúng trong Wails (xterm.js) có quirk đã ghi nhận trong cộng đồng khi chạy chế độ dev (lỗi newline, hoạt động bình thường khi build) — cần kiểm tra kỹ trước khi build chính thức
- Luồng B nếu mở rộng tool-calling sau này là khối lượng công việc tương đương xây lại một phần agent harness của Claude Code/Codex — cần đánh giá nghiêm túc trước khi quyết định làm
- Cộng đồng Wails nhỏ hơn Tauri, ít ví dụ Claude Code GUI tham khảo sẵn — bù lại bằng việc tự thiết kế hệ thống adapter riêng nên ít phụ thuộc vào code mẫu có sẵn

---

## 10. Cấu trúc thư mục project

```
stowe/
├── main.go
├── app.go                           # Wails App struct + tất cả binding ra JS
├── wails.json
├── go.mod / go.sum
│
├── internal/
│   ├── model/
│   │   └── session.go               # Session, RepoGroup structs — chỉ data, không logic
│   │
│   ├── adapter/
│   │   ├── adapter.go               # AgentAdapter interface
│   │   └── claudecode/
│   │       ├── adapter.go           # Implement interface cho Claude Code
│   │       └── parser.go            # Parse JSONL → model.Session
│   │
│   ├── git/
│   │   └── git.go                   # FindRoot(path) string
│   │
│   ├── db/
│   │   ├── db.go                    # Open, schema init, migrations
│   │   └── queries.go               # Tất cả SQL queries
│   │
│   ├── registry/
│   │   └── registry.go              # Orchestrator: scan + cache + query
│   │
│   ├── watcher/
│   │   └── watcher.go               # fsnotify wrapper với debounce 150ms
│   │
│   └── pty/
│       ├── manager.go               # PTY session management
│       ├── pty_unix.go              # //go:build !windows — creack/pty
│       └── pty_windows.go           # //go:build windows — conpty
│
├── build/
│   └── windows/
│       └── icon.ico
│
├── docs/
│   └── plan/
│       └── plan.md                  # Tài liệu thiết kế + roadmap này
│
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.tsx                 # Entry point — KHÔNG có React.StrictMode (xem mục 15)
        ├── App.tsx                  # Root: tab state, welcome state, error state
        ├── components/
        │   ├── Sidebar.tsx          # Nav tabs (History/Favorites/All), search, repo tree
        │   ├── SessionCard.tsx      # Card: title, date, favorite star
        │   ├── SessionDetail.tsx    # Tab bar + session info bar + terminal area + WelcomePage
        │   └── TerminalPane.tsx     # xterm.js connected to Go PTY
        ├── hooks/
        │   ├── useSessions.ts       # Fetch + listen events từ Go
        │   └── useTerminal.ts       # xterm.js lifecycle (KHÔNG gọi CloseTerminal — xem mục 15)
        └── wailsjs/                 # Auto-generated bởi wails dev
```

## 11. Thiết kế Go packages và interfaces

### `internal/model/session.go`

```go
type Session struct {
    ID           string    `json:"id"`
    AgentType    string    `json:"agentType"`   // "claude_code"
    FilePath     string    `json:"filePath"`
    CWD          string    `json:"cwd"`
    GitRoot      string    `json:"gitRoot"`
    Title        string    `json:"title"`       // auto: ai-title → last-prompt → fallback
    CustomName   string    `json:"customName"`  // user-set, override title khi khác ""
    IsFavorite   bool      `json:"isFavorite"`
    CreatedAt    time.Time `json:"createdAt"`
    UpdatedAt    time.Time `json:"updatedAt"`
    MessageCount int       `json:"messageCount"`
    GitBranch    string    `json:"gitBranch"`
}

type RepoGroup struct {
    GitRoot      string    `json:"gitRoot"`
    DisplayName  string    `json:"displayName"` // basename của GitRoot
    Sessions     []Session `json:"sessions"`
    LastActivity time.Time `json:"lastActivity"`
}
```

### `internal/adapter/adapter.go`

```go
type AgentAdapter interface {
    Discover() ([]string, error)              // tất cả file paths trên máy
    Parse(filePath string) (*model.Session, error)
    BinaryPath() (string, error)
    NewChatArgs(cwd string) []string          // args để start chat mới
    ResumeChatArgs(sessionID string) []string // args để resume
    WatchDirs() []string
}
```

### SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id              TEXT PRIMARY KEY,
    agent_type      TEXT NOT NULL,
    file_path       TEXT NOT NULL UNIQUE,
    cwd             TEXT NOT NULL DEFAULT '',
    git_root        TEXT NOT NULL DEFAULT '',
    title           TEXT NOT NULL DEFAULT '',
    custom_name     TEXT NOT NULL DEFAULT '',
    is_favorite     INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    message_count   INTEGER NOT NULL DEFAULT 0,
    git_branch      TEXT NOT NULL DEFAULT '',
    file_mtime      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_git_root ON sessions(git_root);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);

-- FTS5 cho search
CREATE VIRTUAL TABLE IF NOT EXISTS sessions_fts USING fts5(
    id UNINDEXED,
    title,
    custom_name,
    git_root,
    content='sessions',
    content_rowid='rowid'
);
```

### Wails Events (Go → JS)

| Event | Payload | Trigger |
|---|---|---|
| `session:updated` | `model.Session` | watcher phát hiện file thay đổi |
| `session:new` | `model.Session` | session mới sau khi launch |
| `pty:data` | `{id, data}` | output từ terminal |
| `pty:exit` | `{id, code}` | terminal kết thúc |
| `scan:complete` | nil | initial scan xong |

### Wails Bindings (`app.go`)

```go
// Data
func (a *App) GetRepoGroups() []model.RepoGroup
func (a *App) GetSessions(gitRoot string) []model.Session
func (a *App) Search(query string) []model.Session

// Actions
func (a *App) LaunchNewChat(gitRoot string) (string, error)    // → ptyID
func (a *App) ResumeSession(sessionID string) (string, error)  // → ptyID
func (a *App) CloseTerminal(ptyID string)
func (a *App) WriteToTerminal(ptyID string, data string)
func (a *App) ResizeTerminal(ptyID string, cols, rows int)

// Metadata
func (a *App) RenameSession(sessionID, name string) error
func (a *App) ToggleFavorite(sessionID string) error
```

## 12. Implementation Plan V1 MVP

| Bước | Việc | Verify |
|---|---|---|
| 1 | Project bootstrap: `wails init`, cài Tailwind, thêm deps vào `go.mod` | `wails dev` chạy được, React template hiện |
| 2 | `internal/model` + `internal/db`: schema SQLite, WAL mode, FTS5, queries | Unit test: insert → query by git_root → search FTS đúng |
| 3 | `internal/git`: `FindRoot(path)` walk up tìm `.git` | `FindRoot("E:\\SideProject\\Stowe")` trả đúng |
| 4 | `internal/adapter/claudecode`: Discover (có filter subdir), Parse JSONL, BinaryPath, Args | Parse file thực → Session đúng cwd + title |
| 5 | `internal/registry`: InitialScan với worker pool 4, so sánh file_mtime tránh re-parse | Scan ~50 files trong < 2 giây |
| 6 | `internal/watcher`: fsnotify + debounce 150ms, emit event session:new / session:updated | Mở claude, app hiện session mới trong < 1 giây |
| 7 | **`internal/pty`**: ConPTY (Windows) / creack/pty (Unix), Manager | Test với `cmd /k echo hello` trước, sau mới test `claude` |
| 8 | `app.go`: startup wiring tất cả components, expose bindings | `GetRepoGroups()` từ frontend console trả đúng data |
| 9 | Frontend: Sidebar + SessionList + SessionCard | Danh sách repo + session hiện đúng, click lọc được |
| 10 | Frontend: TerminalPane (xterm.js + FitAddon) | Resume session, Claude hiện trong terminal nhúng |
| 11 | Frontend: Search (debounce 200ms) + Rename (inline) + Favorite (star) | Ba tính năng hoạt động end-to-end |

**Lưu ý thứ tự**: Bước 7 (PTY) là rủi ro cao nhất — làm ngay sau khi có backend foundation (bước 1-4), không để cuối cùng.

## 13. Rủi ro kỹ thuật V1

| Rủi ro | Mức | Mitigation |
|---|---|---|
| PTY trên Windows (ConPTY) | CAO | Prototype sớm (bước 7). Dự phòng: mở terminal system thực nếu blocked |
| xterm.js dev mode quirks | TRUNG | Build production sớm (bước 10) để verify. Bug thường chỉ xuất hiện trong dev mode |
| Wails cần GCC toolchain | THẤP | Chạy `wails doctor` ngay sau init. Nếu cần GCC: cài `tdm-gcc` hoặc `msys2` |
| JSONL format thay đổi | THẤP | Parser dùng `map[string]any`, skip dòng lỗi, fallback title — không hard-code |
| Initial scan chậm | THẤP | So sánh `file_mtime` — chỉ re-parse file đã thay đổi. Worker pool 4 goroutines |

## 14. Quyết định kỹ thuật phát sinh trong quá trình build

### PTY lifecycle — CloseTerminal chỉ gọi từ handleCloseTab

**Vấn đề gặp phải:** Terminal hiện tab nhưng nội dung trắng hoàn toàn.

**Root cause:** React StrictMode chạy effect 2 lần (setup → cleanup → setup) để phát hiện side effect không an toàn. Cleanup của `useTerminal` trước đó gọi `CloseTerminal(ptyID)` — điều này kill PTY ở phía Go. Lần setup thứ 2 mount xterm.js mới nhưng PTY đã chết → blank terminal.

**Fix:**
1. Xóa `React.StrictMode` khỏi `main.tsx` — StrictMode không tương thích với xterm.js (double-mount cũng làm xterm render 2 terminal vào cùng DOM node).
2. Xóa `CloseTerminal` khỏi cleanup của `useTerminal`. Hook này chỉ dọn dẹp phía React (unsubscribe events, disconnect ResizeObserver, dispose xterm instance).
3. `CloseTerminal(ptyID)` chỉ được gọi duy nhất từ `handleCloseTab` trong `App.tsx` — khi người dùng bấm × đóng tab.

**Invariant quan trọng:** `CloseTerminal` = kết thúc PTY process trên Go. Chỉ gọi khi người dùng chủ động đóng tab. Không gọi từ React cleanup.

### Multi-terminal: tất cả TerminalPane mount đồng thời

Thay vì unmount terminal khi chuyển tab (gây re-init PTY), tất cả `TerminalPane` đều được mount. Tab không active dùng `invisible pointer-events-none` để ẩn. Khi active trở lại, xterm.js vẫn còn nguyên trạng thái — không cần reconnect PTY.

### agentType guard bị xóa

`handleSelectSession` trước đó có guard kiểm tra `CLI_AGENT_TYPES` — session có `agentType=""` (do data cũ trong DB) sẽ bị block im lặng, không có error. Đã xóa guard này vì tất cả session trong app hiện tại đều là Claude Code CLI session.

---

## TODO

### V1 Bootstrap ✅
- [x] Chạy `wails doctor` — toolchain OK (WebView2, Node, npm)
- [x] `wails init -n stowe -t react-ts` + merge vào Stowe directory
- [x] Tailwind CSS v4.3.2 + Vite 8 + @tailwindcss/vite plugin
- [x] Go deps: `modernc.org/sqlite`, `fsnotify`, `UserExistsError/conpty`, `creack/pty`
- [x] `wails dev` chạy thành công, UI hiện ra

### V1 Backend ✅
- [x] `internal/model/session.go` — Session + RepoGroup structs
- [x] `internal/db/` — schema SQLite với FTS5, WAL mode, queries
- [x] `internal/git/git.go` — FindRoot
- [x] `internal/adapter/claudecode/parser.go` — parse JSONL tolerant
- [x] `internal/adapter/claudecode/adapter.go` — Discover (filter subdir UUID), BinaryPath, Args
- [x] `internal/registry/registry.go` — InitialScan + file_mtime cache + worker pool 4
- [x] `internal/watcher/watcher.go` — fsnotify + debounce 150ms
- [x] `internal/pty/pty_windows.go` — ConPTY wrapper
- [x] `internal/pty/manager.go` — PTY session management
- [x] `app.go` — startup wiring + tất cả bindings

### V1 Frontend ✅
- [x] `App.tsx` — tab state, welcome state, error banner
- [x] `hooks/useSessions.ts` — GetRepoGroups + listen events
- [x] `components/Sidebar.tsx` — nav tabs (History / Favorites / Conversation History), search, repo tree
- [x] `components/SessionCard.tsx` — title, date, star
- [x] `components/SessionDetail.tsx` — VS Code-style tab bar + session info bar + multi-terminal area
- [x] `components/TerminalPane.tsx` — xterm.js + FitAddon + PTY events
- [x] `hooks/useTerminal.ts` — PTY lifecycle (không CloseTerminal trong cleanup)

### V1 UI Refinements ✅
- [x] Fix blank terminal (xóa StrictMode + fix PTY lifecycle — xem mục 15)
- [x] Error banner đỏ khi ResumeSession/LaunchNewChat throw
- [x] Xóa "Active Terminals" khỏi sidebar
- [x] Thêm "Conversation History" tab — flat list tất cả session xuyên repo
- [x] Welcome page khi không có tab nào mở (logo + token usage placeholder)
- [x] Nút Home: click logo/chữ "Stowe" để quay về welcome page
- [x] Inline rename session (double-click title hoặc nút ✏)
- [x] Favorite toggle (★)

### V1 Polish — cần verify
- [ ] Test end-to-end: click session → tab mở → terminal hiện output claude
- [ ] Test multiple tabs: 2 session mở song song, switch không bị blank
- [ ] Test close tab (×): PTY đóng, tab kề được focus
- [ ] Test search debounce 200ms → FTS5 query đúng kết quả
- [ ] Test Conversation History tab — hiện đủ tất cả session
- [ ] Test production build (`wails build`) — terminal newline handling

### V2 (sau khi V1 polish xong)
- [ ] Token/cost tracking: parse usage từ Claude Code JSONL, hiện vào WelcomePage thay placeholder "—"
- [ ] Adapter: Codex CLI
- [ ] Adapter: Gemini CLI
- [ ] Adapter: Antigravity CLI (đọc cả JSONL + SQLite, ưu tiên `.db`)

### V3 (sau V2)
- [ ] API key management qua OS keychain (`zalando/go-keyring`)
- [ ] Chat UI với streaming response
- [ ] Markdown + code block rendering
- [ ] Lưu lịch sử API chat trong SQLite riêng

### V4 (sau V3)
- [ ] Diff viewer (file thay đổi trong session)
- [ ] Git worktree isolation cho luồng A
- [ ] Kanban view xuyên agent
- [ ] Cost/usage dashboard tổng hợp
