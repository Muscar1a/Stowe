import { useState } from 'react'
import type { RepoGroup, Session } from '../hooks/useSessions'
import type { AppMode } from '../App'
import { SessionCard } from './SessionCard'
import { useTheme, THEMES } from '../theme'

interface Props {
  repoGroups: RepoGroup[]
  sessions: Session[]
  selectedSession: Session | null
  onSelectSession: (session: Session) => void
  searchQuery: string
  onSearch: (q: string) => void
  onNewChat: () => void
  mode: AppMode
  onSelectMode: (mode: AppMode) => void
}

// Feature flag: API Chat is not ready yet — hide its entry points in the UI.
const SHOW_API_CHAT = false

export function Sidebar({
  repoGroups,
  sessions,
  selectedSession,
  onSelectSession,
  searchQuery,
  onSearch,
  onNewChat,
  mode,
  onSelectMode,
}: Props) {
  const [viewMode, setViewMode] = useState<'history' | 'favorites' | 'all'>('history')
  // Projects start collapsed — their session history only loads in once clicked open.
  const [collapsedRepos, setCollapsedRepos] = useState<Record<string, boolean>>({})
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [themeHovered, setThemeHovered] = useState(false)
  const { activeTheme, setTheme } = useTheme()

  const HISTORY_PAGE_SIZE = 5

  function toggleRepo(gitRoot: string) {
    setCollapsedRepos(prev => ({ ...prev, [gitRoot]: !(prev[gitRoot] ?? true) }))
  }

  function toggleShowAllHistory(gitRoot: string) {
    setExpandedHistory(prev => ({ ...prev, [gitRoot]: !prev[gitRoot] }))
  }

  // Filter sessions based on search or active view mode
  const isFiltering = Boolean(searchQuery.trim()) || viewMode !== 'history'

  const filteredSessions = sessions.filter(s => {
    if (viewMode === 'favorites') return s.isFavorite
    return true
  })

  const allSessions = repoGroups.flatMap(g => g.sessions)

  return (
    <div className="flex flex-col h-full w-80 shrink-0 bg-bg-sidebar border-r border-border-subtle select-none text-white/80">
      {/* Section switcher: API Chat (upcoming) | Code CLI */}
      {SHOW_API_CHAT && (
      <div className="px-3 pt-3 pb-1">
        <div className="flex bg-white/[0.03] border border-border-subtle rounded-xl p-0.5">
          {([
            { id: 'chat', label: 'API Chat' },
            { id: 'code', label: 'Code CLI' },
          ] as const).map(section => (
            <button
              key={section.id}
              onClick={() => onSelectMode(section.id)}
              className={`flex-1 py-1.5 rounded-[10px] text-xs font-medium transition-colors ${
                mode === section.id
                  ? 'bg-white/[0.09] text-white shadow-sm'
                  : 'text-white/40 hover:text-white/75'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {SHOW_API_CHAT && mode === 'chat' ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-xs text-white/30">API chat sessions will appear here once available.</p>
        </div>
      ) : (
      <>
      {/* New Session Button */}
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.06] border border-border-subtle text-white/90 hover:text-white rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-sm font-medium transition-all shadow-sm group"
        >
          <span className="text-accent-primary font-light text-lg leading-none group-hover:scale-110 transition-transform">+</span>
          <span>New Session</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-2 py-1 space-y-0.5 text-sm">
        <button
          onClick={() => setViewMode('history')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'history' && !searchQuery ? 'bg-white/[0.06] text-white font-medium' : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <span className="text-base leading-none opacity-80">↺</span>
          <span>Session History</span>
        </button>

        <button
          onClick={() => setViewMode('favorites')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'favorites' ? 'bg-white/[0.06] text-white font-medium' : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <span className="text-base leading-none opacity-80 text-yellow-400/90">☆</span>
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setViewMode('all')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'all' ? 'bg-white/[0.06] text-white font-medium' : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <span className="text-base leading-none opacity-80">☰</span>
          <span>Conversation History</span>
        </button>

      </div>

      {/* Search Input */}
      <div className="px-3 py-2">
        <div className="relative flex items-center">
          <span className="absolute left-3 text-white/30 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-border-subtle rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-accent-primary/50 focus:bg-white/[0.05] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 text-white/40 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Repositories Tree / Session List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {viewMode === 'all' && !searchQuery ? (
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-1.5">
              ALL CONVERSATIONS ({allSessions.length})
            </p>
            {allSessions.length === 0 ? (
              <p className="text-xs text-white/30 px-3 py-4 text-center">No conversations found</p>
            ) : (
              <div className="space-y-0.5">
                {allSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isSelected={selectedSession?.id === s.id}
                    onOpen={onSelectSession}
                  />
                ))}
              </div>
            )}
          </div>
        ) : isFiltering ? (
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-1.5">
              {searchQuery ? `Search Results (${filteredSessions.length})` : 'Favorite Sessions'}
            </p>
            {filteredSessions.length === 0 ? (
              <p className="text-xs text-white/30 px-3 py-4 text-center">No matching sessions found</p>
            ) : (
              <div className="space-y-0.5">
                {filteredSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isSelected={selectedSession?.id === s.id}
                    onOpen={onSelectSession}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-2">
              PROJECTS
            </p>
            <div className="space-y-1">
              {repoGroups.map(group => {
                const isCollapsed = collapsedRepos[group.gitRoot] ?? true
                const groupSessions = group.sessions
                const showAll = expandedHistory[group.gitRoot] ?? false
                const visibleSessions = showAll ? groupSessions : groupSessions.slice(0, HISTORY_PAGE_SIZE)

                return (
                  <div key={group.gitRoot} className="space-y-0.5">
                    {/* Repo Header */}
                    <div
                      onClick={() => toggleRepo(group.gitRoot)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-white/[0.04] text-white/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-white/40 transition-transform duration-150">
                          {isCollapsed ? '›' : '⌄'}
                        </span>
                        <span className="text-sm">📁</span>
                        <span className="text-sm font-medium text-white/90 truncate">
                          {group.displayName}
                        </span>
                      </div>
                      <span className="bg-white/[0.06] text-white/50 text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        {groupSessions.length}
                      </span>
                    </div>

                    {/* Sessions inside this repo — loaded only once the project is opened */}
                    {!isCollapsed && (
                      <div className="pl-2 pr-1 space-y-0.5 border-l border-border-subtle ml-3">
                        {visibleSessions.map(s => (
                          <SessionCard
                            key={s.id}
                            session={s}
                            isSelected={selectedSession?.id === s.id}
                            onOpen={onSelectSession}
                          />
                        ))}
                        {groupSessions.length > HISTORY_PAGE_SIZE && (
                          <button
                            onClick={() => toggleShowAllHistory(group.gitRoot)}
                            className="w-full text-left px-2.5 py-1.5 text-[11px] font-medium text-accent-primary/80 hover:text-accent-primary transition-colors"
                          >
                            {showAll ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Settings Footer */}
      <div className="p-3 border-t border-border-subtle mt-auto relative">
        <button
          onClick={() => setSettingsOpen(open => !open)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors w-full ${
            settingsOpen ? 'bg-white/[0.08] text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-base">⚙</span>
          <span>Settings</span>
        </button>

        {settingsOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setSettingsOpen(false); setThemeHovered(false) }} />
            <div className="absolute left-3 bottom-full mb-2 z-50 w-52 rounded-xl border border-border-subtle bg-bg-sidebar shadow-2xl py-1.5 text-xs text-white/80 select-none">
              <div
                className="relative px-3 py-2 flex items-center justify-between hover:bg-white/[0.06] hover:text-white cursor-pointer transition-colors"
                onMouseEnter={() => setThemeHovered(true)}
                onMouseLeave={() => setThemeHovered(false)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">🎨</span>
                  <span>Theme</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40">
                  <span className="text-[11px] truncate max-w-[80px] text-accent-primary">{activeTheme.name}</span>
                  <span>›</span>
                </div>

                {/* Submenu for themes */}
                {themeHovered && (
                  <div className="absolute left-full bottom-0 ml-1 z-50 w-48 rounded-xl border border-border-subtle bg-bg-sidebar shadow-2xl py-1.5 overflow-hidden">
                    <p className="px-3 py-1 text-[10px] font-bold text-white/30 uppercase tracking-wider">Select Theme</p>
                    <div className="h-px bg-border-subtle my-1" />
                    <div className="max-h-60 overflow-y-auto">
                      {THEMES.map(t => {
                        const isAct = activeTheme.id === t.id
                        return (
                          <button
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setTheme(t.id)
                              setSettingsOpen(false)
                              setThemeHovered(false)
                            }}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-white/[0.06] transition-colors ${
                              isAct ? 'text-accent-primary font-medium' : 'text-white/80 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{t.name}</span>
                            {isAct && <span className="text-accent-primary shrink-0 ml-2">✓</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
