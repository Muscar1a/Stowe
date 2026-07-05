import { useEffect, useState } from 'react'
import { GetRepoGroups, Search } from '../../wailsjs/go/main/App'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import type { model } from '../../wailsjs/go/models'

export type RepoGroup = model.RepoGroup
export type Session = model.Session

/** Display title for a session: the user's custom name wins over the derived title. */
export function sessionTitle(session: Session, fallback = 'Session'): string {
  return session.customName || session.title || fallback
}

export function useSessions() {
  const [repoGroups, setRepoGroups] = useState<RepoGroup[]>([])
  const [selectedGitRoot, setSelectedGitRoot] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Session[] | null>(null)

  useEffect(() => {
    GetRepoGroups().then(setRepoGroups)

    const offScan = EventsOn('scan:complete', () => {
      GetRepoGroups().then(setRepoGroups)
    })
    const offUpdated = EventsOn('session:updated', (session: Session) => {
      setRepoGroups(prev => updateSessionInGroups(prev, session))
    })
    const offNew = EventsOn('session:new', () => {
      GetRepoGroups().then(setRepoGroups)
    })

    return () => {
      offScan()
      offUpdated()
      offNew()
    }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(() => {
      Search(searchQuery).then(r => setSearchResults(r ?? []))
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const sessions = selectedGitRoot
    ? repoGroups.find(g => g.gitRoot === selectedGitRoot)?.sessions ?? []
    : repoGroups.flatMap(g => g.sessions)

  return {
    repoGroups,
    sessions: searchResults ?? sessions,
    selectedGitRoot,
    setSelectedGitRoot,
    searchQuery,
    setSearchQuery,
    isSearching: searchResults !== null,
  }
}

function updateSessionInGroups(groups: RepoGroup[], updated: Session): RepoGroup[] {
  return groups.map(g => ({
    ...g,
    sessions: g.sessions.map(s => s.id === updated.id ? updated : s),
  } as RepoGroup))
}
