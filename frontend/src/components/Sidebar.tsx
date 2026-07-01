import { useState } from 'react'
import type { RepoGroup, Session } from '../hooks/useSessions'
import { SessionCard } from './SessionCard'

interface Props {
  repoGroups: RepoGroup[]
  sessions: Session[]
  selectedSession: Session | null
  onSelectSession: (session: Session) => void
  searchQuery: string
  onSearch: (q: string) => void
  onNewChat: () => void
  activeTerminalCount: number
}

export function Sidebar({
  repoGroups,
  sessions,
  selectedSession,
  onSelectSession,
  searchQuery,
  onSearch,
  onNewChat,
  activeTerminalCount,
}: Props) {
  const [viewMode, setViewMode] = useState<'history' | 'favorites' | 'active'>('history')
  const [collapsedRepos, setCollapsedRepos] = useState<Record<string, boolean>>({})

  function toggleRepo(gitRoot: string) {
    setCollapsedRepos(prev => ({ ...prev, [gitRoot]: !prev[gitRoot] }))
  }

  // Filter sessions based on search or active view mode
  const isFiltering = Boolean(searchQuery.trim()) || viewMode !== 'history'

  const filteredSessions = sessions.filter(s => {
    if (viewMode === 'favorites') return s.isFavorite
    return true
  })

  return (
    <div className="flex flex-col h-full w-80 shrink-0 bg-[#0c0e14] border-r border-white/[0.06] select-none text-white/80">
      {/* App Branding & Window Header placeholder */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-[11px] font-black text-white shadow-sm">
            S
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">Stowe</span>
        </div>
      </div>

      {/* New Session Button */}
      <div className="px-3 py-2">
        <button
          onClick={onNewChat}
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.06] border border-white/[0.08] text-white/90 hover:text-white rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-sm font-medium transition-all shadow-sm group"
        >
          <span className="text-blue-400 font-light text-lg leading-none group-hover:scale-110 transition-transform">+</span>
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
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'favorites' ? 'bg-white/[0.06] text-white font-medium' : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-base leading-none opacity-80 text-yellow-400/90">☆</span>
            <span>Favorites</span>
          </div>
        </button>

        <button
          onClick={() => setViewMode('active')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'active' ? 'bg-white/[0.06] text-white font-medium' : 'text-white/60 hover:text-white/90 hover:bg-white/[0.03]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-1 py-0.5 bg-white/10 rounded text-blue-400">&gt;_</span>
            <span>Active Terminals</span>
          </div>
          {activeTerminalCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm">
              {activeTerminalCount}
            </span>
          )}
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
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
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
        {isFiltering ? (
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider px-2 mb-1.5">
              {searchQuery ? `Search Results (${filteredSessions.length})` : viewMode === 'favorites' ? 'Favorite Sessions' : 'Sessions'}
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
              REPOSITORIES
            </p>
            <div className="space-y-1">
              {repoGroups.map(group => {
                const isCollapsed = collapsedRepos[group.gitRoot]
                const groupSessions = group.sessions

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

                    {/* Sessions inside this repo */}
                    {!isCollapsed && (
                      <div className="pl-2 pr-1 space-y-0.5 border-l border-white/[0.04] ml-3">
                        {groupSessions.map(s => (
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
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings Footer */}
      <div className="p-3 border-t border-white/[0.06] mt-auto">
        <button className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors w-full">
          <span className="text-base">⚙</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  )
}
