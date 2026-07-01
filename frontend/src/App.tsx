import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SessionDetail } from './components/SessionDetail'
import { useSessions } from './hooks/useSessions'
import { LaunchNewChat, ResumeSession, CloseTerminal } from '../wailsjs/go/main/App'
import type { Session } from './hooks/useSessions'

export interface TabEntry {
  ptyID: string
  sessionID: string | null
  title: string
}

export default function App() {
  const { repoGroups, sessions, searchQuery, setSearchQuery } = useSessions()
  const [tabs, setTabs] = useState<TabEntry[]>([])
  const [activeTabPtyId, setActiveTabPtyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeTab = tabs.find(t => t.ptyID === activeTabPtyId) ?? null
  const activeSession = activeTab?.sessionID
    ? sessions.find(s => s.id === activeTab.sessionID) ?? null
    : null

  async function handleSelectSession(session: Session) {
    // Already open — just focus its tab
    const existing = tabs.find(t => t.sessionID === session.id)
    if (existing) {
      setActiveTabPtyId(existing.ptyID)
      return
    }

    try {
      const ptyID = await ResumeSession(session.id)
      const newTab: TabEntry = {
        ptyID,
        sessionID: session.id,
        title: session.customName || session.title || 'Session',
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabPtyId(ptyID)
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }

  async function handleNewChat() {
    try {
      const gitRoot = activeSession?.gitRoot ?? ''
      const ptyID = await LaunchNewChat(gitRoot)
      const newTab: TabEntry = { ptyID, sessionID: null, title: 'New chat' }
      setTabs(prev => [...prev, newTab])
      setActiveTabPtyId(ptyID)
      setError(null)
    } catch (err) {
      setError(String(err))
    }
  }

  function handleCloseTab(ptyID: string) {
    CloseTerminal(ptyID)
    setTabs(prev => {
      const idx = prev.findIndex(t => t.ptyID === ptyID)
      const next = prev.filter(t => t.ptyID !== ptyID)
      if (activeTabPtyId === ptyID) {
        const nextActive = next[idx] ?? next[idx - 1] ?? null
        setActiveTabPtyId(nextActive?.ptyID ?? null)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-screen bg-[#090b10] text-white overflow-hidden font-sans">
      {error && (
        <div className="shrink-0 bg-red-900/60 border-b border-red-700/50 px-4 py-2 text-xs text-red-300 flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-white">×</button>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
      <Sidebar
        repoGroups={repoGroups}
        sessions={sessions}
        selectedSession={activeSession}
        onSelectSession={handleSelectSession}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onNewChat={handleNewChat}
      />
      <SessionDetail
        session={activeSession}
        repoGroups={repoGroups}
        tabs={tabs}
        activeTabPtyId={activeTabPtyId}
        onSelectTab={setActiveTabPtyId}
        onCloseTab={handleCloseTab}
      />
      </div>
    </div>
  )
}
