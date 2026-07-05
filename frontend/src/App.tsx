import { useState } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { SessionDetail } from './components/SessionDetail'
import { useSessions, sessionTitle } from './hooks/useSessions'
import { LaunchNewChat, ResumeSession, CloseTerminal } from '../wailsjs/go/main/App'
import type { Session } from './hooks/useSessions'

export interface TabEntry {
  ptyID: string
  sessionID: string | null
  title: string
}

/** Top-level app section: 'chat' = API-based chats (upcoming), 'code' = CLI terminals. */
export type AppMode = 'chat' | 'code'

/** A navigable screen in the main content area: the launcher page or an open tab. */
type Page = { type: 'home' } | { type: 'tab'; ptyID: string }

const MAX_BACK_HISTORY = 10

function pagesEqual(a: Page, b: Page): boolean {
  return a.type === 'home' ? b.type === 'home' : b.type === 'tab' && b.ptyID === a.ptyID
}

export default function App() {
  const { repoGroups, sessions, searchQuery, setSearchQuery } = useSessions()
  const [tabs, setTabs] = useState<TabEntry[]>([])
  const [activeTabPtyId, setActiveTabPtyId] = useState<string | null>(null)
  const [showHome, setShowHome] = useState(false)
  const [appMode, setAppMode] = useState<AppMode>('code')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backStack, setBackStack] = useState<Page[]>([])
  const [forwardStack, setForwardStack] = useState<Page[]>([])

  const activeTab = tabs.find(t => t.ptyID === activeTabPtyId) ?? null
  const activeSession = activeTab?.sessionID
    ? sessions.find(s => s.id === activeTab.sessionID) ?? null
    : null

  const currentPage: Page = showHome || !activeTabPtyId ? { type: 'home' } : { type: 'tab', ptyID: activeTabPtyId }

  function applyPage(page: Page) {
    if (page.type === 'home') {
      setShowHome(true)
    } else {
      setActiveTabPtyId(page.ptyID)
      setShowHome(false)
    }
  }

  /** Record a page transition so Go Back/Forward can retrace it. */
  function navigateTo(page: Page) {
    if (pagesEqual(currentPage, page)) return
    setBackStack(prev => [...prev, currentPage].slice(-MAX_BACK_HISTORY))
    setForwardStack([])
    applyPage(page)
  }

  function openTab(tab: TabEntry) {
    setBackStack(prev => [...prev, currentPage].slice(-MAX_BACK_HISTORY))
    setForwardStack([])
    setTabs(prev => [...prev, tab])
    setActiveTabPtyId(tab.ptyID)
    setShowHome(false)
    setError(null)
  }

  async function handleSelectSession(session: Session) {
    // Already open — just focus its tab
    const existing = tabs.find(t => t.sessionID === session.id)
    if (existing) {
      navigateTo({ type: 'tab', ptyID: existing.ptyID })
      return
    }

    try {
      const ptyID = await ResumeSession(session.id)
      openTab({ ptyID, sessionID: session.id, title: sessionTitle(session) })
    } catch (err) {
      setError(String(err))
    }
  }

  async function handleNewChat() {
    try {
      const gitRoot = activeSession?.gitRoot ?? ''
      const ptyID = await LaunchNewChat(gitRoot)
      openTab({ ptyID, sessionID: null, title: 'New chat' })
    } catch (err) {
      setError(String(err))
    }
  }

  function handleSelectTab(ptyID: string) {
    navigateTo({ type: 'tab', ptyID })
  }

  function handleSelectMode(mode: AppMode) {
    setAppMode(mode)
    // "Code CLI" lands on the launcher page; open terminals stay in their tabs
    if (mode === 'code') navigateTo({ type: 'home' })
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

  // A page pointing at a since-closed tab can no longer be visited — skip past it.
  function isReachable(page: Page): boolean {
    return page.type === 'home' || tabs.some(t => t.ptyID === page.ptyID)
  }

  function handleGoBack() {
    const stack = [...backStack]
    let target = stack.pop()
    while (target && !isReachable(target)) target = stack.pop()
    if (!target) {
      setBackStack([])
      return
    }
    setForwardStack(prev => [...prev, currentPage])
    setBackStack(stack)
    applyPage(target)
  }

  function handleGoForward() {
    const stack = [...forwardStack]
    let target = stack.pop()
    while (target && !isReachable(target)) target = stack.pop()
    if (!target) {
      setForwardStack([])
      return
    }
    setBackStack(prev => [...prev, currentPage].slice(-MAX_BACK_HISTORY))
    setForwardStack(stack)
    applyPage(target)
  }

  const canGoBack = backStack.some(isReachable)
  const canGoForward = forwardStack.some(isReachable)

  return (
    <div className="flex flex-col h-screen bg-bg-main text-white overflow-hidden font-sans">
      <TitleBar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(prev => !prev)}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
      />
      {error && (
        <div className="shrink-0 bg-red-900/60 border-b border-red-700/50 px-4 py-2 text-xs text-red-300 flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-white">×</button>
        </div>
      )}
      <div className="flex flex-1 min-h-0">
      {/* Hidden (not unmounted) when collapsed so sidebar state survives toggling */}
      <div className={sidebarCollapsed ? 'hidden' : 'contents'}>
        <Sidebar
          repoGroups={repoGroups}
          sessions={sessions}
          selectedSession={activeSession}
          onSelectSession={handleSelectSession}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onNewChat={handleNewChat}
          mode={appMode}
          onSelectMode={handleSelectMode}
        />
      </div>
      {appMode === 'chat' && <ApiChatPlaceholder />}
      {/* Hidden (not unmounted) in chat mode so running terminals survive switching */}
      <div className={appMode === 'chat' ? 'hidden' : 'contents'}>
        <SessionDetail
          session={activeSession}
          repoGroups={repoGroups}
          tabs={tabs}
          activeTabPtyId={activeTabPtyId}
          showHome={showHome}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewChat={handleNewChat}
        />
      </div>
      </div>
    </div>
  )
}

function ApiChatPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 select-none min-w-0">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-2xl">💬</div>
      <p className="text-sm font-semibold text-white/85">Chat via API</p>
      <p className="text-xs text-white/35">Upcoming — regular conversations using your own API key.</p>
    </div>
  )
}
