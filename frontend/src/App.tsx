import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { SessionList } from './components/SessionList'
import { TerminalPane } from './components/TerminalPane'
import { useSessions } from './hooks/useSessions'
import { LaunchNewChat, ResumeSession } from '../wailsjs/go/main/App'
import type { Session } from './hooks/useSessions'

interface ActiveTerminal {
  ptyID: string
  title: string
}

export default function App() {
  const { repoGroups, sessions, selectedGitRoot, setSelectedGitRoot, searchQuery, setSearchQuery, isSearching } = useSessions()
  const [terminal, setTerminal] = useState<ActiveTerminal | null>(null)

  async function handleOpenSession(session: Session) {
    const ptyID = await ResumeSession(session.id)
    setTerminal({
      ptyID,
      title: session.customName || session.title || 'Session',
    })
  }

  async function handleNewChat() {
    const cwd = selectedGitRoot ?? ''
    const ptyID = await LaunchNewChat(cwd)
    setTerminal({ ptyID, title: 'New chat' })
  }

  function handleCloseTerminal() {
    setTerminal(null)
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden">
      <Sidebar
        repoGroups={repoGroups}
        selectedGitRoot={selectedGitRoot}
        onSelect={setSelectedGitRoot}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onNewChat={handleNewChat}
      />

      {/* Session list */}
      <div className={`flex flex-col overflow-hidden transition-all duration-200 ${terminal ? 'w-72 shrink-0' : 'flex-1'}`}>
        <div className="flex items-center px-4 py-3 border-b border-white/[0.08] shrink-0">
          <h2 className="text-sm font-medium text-white/70">
            {isSearching
              ? `Results for "${searchQuery}"`
              : selectedGitRoot
              ? repoGroups.find(g => g.gitRoot === selectedGitRoot)?.displayName ?? 'Sessions'
              : 'All sessions'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SessionList
            sessions={sessions}
            repoGroups={repoGroups}
            selectedGitRoot={selectedGitRoot}
            isSearching={isSearching}
            onOpen={handleOpenSession}
          />
        </div>
      </div>

      {/* Terminal pane */}
      {terminal && (
        <div className="flex-1 border-l border-white/[0.08]">
          <TerminalPane
            ptyID={terminal.ptyID}
            title={terminal.title}
            onClose={handleCloseTerminal}
          />
        </div>
      )}
    </div>
  )
}
