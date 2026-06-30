import { SessionCard } from './SessionCard'
import type { Session, RepoGroup } from '../hooks/useSessions'

interface Props {
  sessions: Session[]
  repoGroups: RepoGroup[]
  selectedGitRoot: string | null
  isSearching: boolean
  onOpen: (session: Session) => void
}

export function SessionList({ sessions, repoGroups, selectedGitRoot, isSearching, onOpen }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/30 text-sm">
        {isSearching ? 'No results' : 'No sessions'}
      </div>
    )
  }

  // When a specific repo is selected or searching — flat list
  if (selectedGitRoot || isSearching) {
    return (
      <div className="flex flex-col gap-0.5 p-2">
        {sessions.map(s => (
          <SessionCard key={s.id} session={s} onOpen={onOpen} />
        ))}
      </div>
    )
  }

  // All repos — grouped
  return (
    <div className="flex flex-col gap-4 p-2">
      {repoGroups.map(group => (
        <div key={group.gitRoot}>
          <p className="text-xs text-white/30 font-medium uppercase tracking-wider px-3 mb-1">
            {group.displayName}
          </p>
          {group.sessions.map(s => (
            <SessionCard key={s.id} session={s} onOpen={onOpen} />
          ))}
        </div>
      ))}
    </div>
  )
}
