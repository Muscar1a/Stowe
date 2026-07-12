import { useState } from 'react'
import type { RepoGroup, Session } from '../hooks/useSessions'
import type { AppMode } from '../App'
import { SessionCard } from './SessionCard'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  HistoryIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  XIcon,
} from './icons'

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
    <div className="flex flex-col h-full w-80 shrink-0 bg-bg-sidebar border-r border-border-subtle select-none text-text-main">
      {/* Section switcher: API Chat (upcoming) | Code CLI */}
      {SHOW_API_CHAT && (
      <div className="px-3 pt-3 pb-1">
        <div className="flex bg-bg-raised border border-border-subtle rounded-control p-0.5">
          {([
            { id: 'chat', label: 'API Chat' },
            { id: 'code', label: 'Code CLI' },
          ] as const).map(section => (
            <button
              key={section.id}
              onClick={() => onSelectMode(section.id)}
              className={`flex-1 py-1.5 rounded-chip text-xs font-medium transition-colors ${
                mode === section.id
                  ? 'bg-bg-active text-text-main'
                  : 'text-text-faint hover:text-text-muted'
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
          <p className="text-xs text-text-faint">API chat sessions will appear here once available.</p>
        </div>
      ) : (
      <>
      {/* New Session Button */}
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="w-full bg-bg-raised hover:bg-bg-hover active:bg-bg-active border border-border-subtle text-text-main rounded-control px-3 py-2 flex items-center gap-2.5 text-sm font-medium transition-colors"
        >
          <PlusIcon className="text-accent-primary shrink-0" />
          <span>New Session</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-2 py-1 space-y-0.5 text-sm">
        <button
          onClick={() => setViewMode('history')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-control transition-colors ${
            viewMode === 'history' && !searchQuery ? 'bg-bg-hover text-text-main font-medium' : 'text-text-muted hover:text-text-main hover:bg-bg-raised'
          }`}
        >
          <HistoryIcon className="shrink-0 opacity-70" />
          <span>Session History</span>
        </button>

        <button
          onClick={() => setViewMode('favorites')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-control transition-colors ${
            viewMode === 'favorites' ? 'bg-bg-hover text-text-main font-medium' : 'text-text-muted hover:text-text-main hover:bg-bg-raised'
          }`}
        >
          <StarIcon className="shrink-0 opacity-70" />
          <span>Favorites</span>
        </button>

        <button
          onClick={() => setViewMode('all')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-control transition-colors ${
            viewMode === 'all' ? 'bg-bg-hover text-text-main font-medium' : 'text-text-muted hover:text-text-main hover:bg-bg-raised'
          }`}
        >
          <ListIcon className="shrink-0 opacity-70" />
          <span>Conversation History</span>
        </button>

      </div>

      {/* Search Input */}
      <div className="px-3 py-2">
        <div className="relative flex items-center">
          <SearchIcon size={12} className="absolute left-3 text-text-faint" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-bg-raised border border-border-subtle rounded-control pl-8 pr-7 py-2 text-xs text-text-main placeholder-text-faint outline-none focus:border-accent-primary/50 focus:bg-bg-hover transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 text-text-faint hover:text-text-main"
              title="Clear search"
            >
              <XIcon size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Repositories Tree / Session List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {viewMode === 'all' && !searchQuery ? (
          <div>
            <p className="font-mono text-[10px] font-semibold text-text-faint uppercase tracking-wider px-2 mb-1.5">
              ALL CONVERSATIONS ({allSessions.length})
            </p>
            {allSessions.length === 0 ? (
              <p className="text-xs text-text-faint px-3 py-4 text-center">No conversations found</p>
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
            <p className="font-mono text-[10px] font-semibold text-text-faint uppercase tracking-wider px-2 mb-1.5">
              {searchQuery ? `Search Results (${filteredSessions.length})` : 'Favorite Sessions'}
            </p>
            {filteredSessions.length === 0 ? (
              <p className="text-xs text-text-faint px-3 py-4 text-center">No matching sessions found</p>
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
            <p className="font-mono text-[10px] font-semibold text-text-faint uppercase tracking-wider px-2 mb-2">
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
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-control cursor-pointer hover:bg-bg-raised text-text-main transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-text-faint shrink-0">
                          {isCollapsed ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
                        </span>
                        <FolderIcon className="text-text-faint shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {group.displayName}
                        </span>
                      </div>
                      <span className="bg-bg-hover text-text-faint font-mono text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
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

    </div>
  )
}
