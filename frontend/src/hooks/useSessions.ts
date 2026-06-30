import { useEffect, useState } from 'react'
import { GetRepoGroups, Search } from '../../wailsjs/go/main/App'
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime'
import type { model } from '../../wailsjs/go/models'

export type RepoGroup = model.RepoGroup
export type Session = model.Session

export function useSessions() {
  const [repoGroups, setRepoGroups] = useState<RepoGroup[]>([])
  const [selectedGitRoot, setSelectedGitRoot] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Session[] | null>(null)

  useEffect(() => {
    GetRepoGroups().then(setRepoGroups)

    EventsOn('scan:complete', () => {
      GetRepoGroups().then(setRepoGroups)
    })

    EventsOn('session:updated', (session: Session) => {
      setRepoGroups(prev => updateSessionInGroups(prev, session))
    })

    EventsOn('session:new', () => {
      GetRepoGroups().then(setRepoGroups)
    })

    return () => {
      EventsOff('scan:complete')
      EventsOff('session:updated')
      EventsOff('session:new')
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
