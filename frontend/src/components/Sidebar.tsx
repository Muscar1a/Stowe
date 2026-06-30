import type { RepoGroup } from '../hooks/useSessions'

interface Props {
  repoGroups: RepoGroup[]
  selectedGitRoot: string | null
  onSelect: (gitRoot: string | null) => void
  searchQuery: string
  onSearch: (q: string) => void
  onNewChat: () => void
}

export function Sidebar({ repoGroups, selectedGitRoot, onSelect, searchQuery, onSearch, onNewChat }: Props) {
  return (
    <div className="flex flex-col h-full w-60 shrink-0 bg-white/[0.03] border-r border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
        <span className="text-sm font-semibold text-white/80">Stowe</span>
        <button
          className="text-xs text-white/50 hover:text-white/90 transition-colors px-2 py-1 rounded hover:bg-white/10"
          onClick={onNewChat}
          title="New chat"
        >
          + New
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/[0.08]">
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          className="w-full bg-white/[0.06] text-sm text-white/80 placeholder-white/30 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/60"
        />
      </div>

      {/* Repo list */}
      <nav className="flex-1 overflow-y-auto py-1.5">
        <button
          className={`w-full text-left text-sm px-4 py-1.5 rounded mx-1 transition-colors ${
            selectedGitRoot === null
              ? 'text-white bg-white/10'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
          style={{ width: 'calc(100% - 8px)' }}
          onClick={() => onSelect(null)}
        >
          All repos
        </button>

        {repoGroups.map(group => (
          <button
            key={group.gitRoot}
            className={`w-full text-left text-sm px-4 py-1.5 rounded mx-1 truncate transition-colors ${
              selectedGitRoot === group.gitRoot
                ? 'text-white bg-white/10'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
            style={{ width: 'calc(100% - 8px)' }}
            onClick={() => onSelect(group.gitRoot)}
            title={group.gitRoot}
          >
            {group.displayName}
          </button>
        ))}
      </nav>
    </div>
  )
}
