import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SessionDetail } from './components/SessionDetail'
import { useSessions } from './hooks/useSessions'
import { LaunchNewChat, ResumeSession, CloseTerminal } from '../wailsjs/go/main/App'
import type { Session } from './hooks/useSessions'

const CLI_AGENT_TYPES = new Set(['claude_code', 'codex', 'antigravity', 'gemini_cli'])

export interface TabEntry {
  ptyID: string
  sessionID: string | null
  title: string
}

export default function App() {
  const { repoGroups, sessions, searchQuery, setSearchQuery } = useSessions()
  const [tabs, setTabs] = useState<TabEntry[]>([])
  const [activeTabPtyId, setActiveTabPtyId] = useState<string | null>(null)

  const activeTab = tabs.find(t => t.ptyID === activeTabPtyId) ?? null
  const activeSession = activeTab?.sessionID
    ? sessions.find(s => s.id === activeTab.sessionID) ?? null
    : null

  async function handleSelectSession(session: Session) {
    if (!CLI_AGENT_TYPES.has(session.agentType?.toLowerCase() ?? '')) return

    // Already open — just focus its tab
    const existing = tabs.find(t => t.sessionID === session.id)
    if (existing) {
      setActiveTabPtyId(existing.ptyID)
      return
    }

    const ptyID = await ResumeSession(session.id)
    const newTab: TabEntry = {
      ptyID,
      sessionID: session.id,
      title: session.customName || session.title || 'Session',
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabPtyId(ptyID)
  }

  async function handleNewChat() {
    const gitRoot = activeSession?.gitRoot ?? ''
    const ptyID = await LaunchNewChat(gitRoot)
    const newTab: TabEntry = { ptyID, sessionID: null, title: 'New chat' }
    setTabs(prev => [...prev, newTab])
    setActiveTabPtyId(ptyID)
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
    <div className="flex h-screen bg-[#090b10] text-white overflow-hidden font-sans">
      <Sidebar
        repoGroups={repoGroups}
        sessions={sessions}
        selectedSession={activeSession}
        onSelectSession={handleSelectSession}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onNewChat={handleNewChat}
        activeTerminalCount={tabs.length}
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
  )
}
