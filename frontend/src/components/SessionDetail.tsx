import { useState, useRef } from 'react'
import { RenameSession, ToggleFavorite } from '../../wailsjs/go/main/App'
import type { Session, RepoGroup } from '../hooks/useSessions'
import type { TabEntry } from '../App'
import { TerminalPane } from './TerminalPane'

interface Props {
  session: Session | null
  repoGroups: RepoGroup[]
  tabs: TabEntry[]
  activeTabPtyId: string | null
  onSelectTab: (ptyID: string) => void
  onCloseTab: (ptyID: string) => void
}

export function SessionDetail({ session, repoGroups, tabs, activeTabPtyId, onSelectTab, onCloseTab }: Props) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (tabs.length === 0) {
    return <WelcomePage />
  }

  const repoGroup = session ? repoGroups.find(g => g.gitRoot === session.gitRoot) : null
  const repoName = repoGroup?.displayName || session?.gitRoot?.split(/[/\\]/).pop() || ''
  const displayTitle = session
    ? (session.customName || session.title || 'Session')
    : (tabs.find(t => t.ptyID === activeTabPtyId)?.title ?? 'Terminal')

  function startRename() {
    if (!session) return
    setDraftName(session.customName || session.title || '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitRename() {
    setEditing(false)
    const name = draftName.trim()
    if (session && name && name !== (session.customName || session.title)) {
      RenameSession(session.id, name)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#090b10] overflow-hidden text-white min-w-0">

      {/* Tab bar */}
      <div className="flex items-stretch bg-[#0a0c12] border-b border-white/[0.06] overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const tabSession = repoGroups.flatMap(g => g.sessions).find(s => s.id === tab.sessionID)
          const tabTitle = tabSession ? (tabSession.customName || tabSession.title) : tab.title
          const isActive = tab.ptyID === activeTabPtyId

          return (
            <div
              key={tab.ptyID}
              onClick={() => onSelectTab(tab.ptyID)}
              className={`group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer shrink-0 border-r border-white/[0.05] select-none max-w-[180px] transition-colors ${
                isActive
                  ? 'bg-[#090b10] text-white/90 border-t-[1.5px] border-t-blue-500'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border-t-[1.5px] border-t-transparent'
              }`}
            >
              <span className="font-mono text-[10px] text-white/30 shrink-0">&gt;_</span>
              <span className="truncate flex-1">{tabTitle}</span>
              <button
                onClick={e => { e.stopPropagation(); onCloseTab(tab.ptyID) }}
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                title="Close"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* Thin session info bar */}
      <div className="h-9 border-b border-white/[0.04] px-4 flex items-center gap-2 text-xs text-white/50 shrink-0 bg-white/[0.01]">
        {repoName && <span className="text-white/35 shrink-0">📁 {repoName}</span>}
        {repoName && <span className="text-white/20">/</span>}

        {editing ? (
          <input
            ref={inputRef}
            className="bg-white/10 text-white text-xs rounded px-1.5 py-0.5 outline-none border border-blue-500 min-w-0"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        ) : (
          <span
            className="text-white/75 font-medium truncate cursor-pointer hover:text-white transition-colors"
            onDoubleClick={startRename}
            title="Double-click to rename"
          >
            {displayTitle}
          </span>
        )}

        {session && (
          <>
            <button
              onClick={startRename}
              className="text-white/25 hover:text-white/65 transition-colors shrink-0"
              title="Rename"
            >✏</button>
            <button
              onClick={() => ToggleFavorite(session.id)}
              className={`transition-colors shrink-0 ${session.isFavorite ? 'text-yellow-400' : 'text-white/25 hover:text-white/65'}`}
              title={session.isFavorite ? 'Remove favorite' : 'Add favorite'}
            >★</button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2 text-white/35 shrink-0">
          {session?.gitBranch && <span className="font-mono">⎇ {session.gitBranch}</span>}
          {session?.messageCount != null && <span>💬 {session.messageCount}</span>}
        </div>
      </div>

      {/* Terminal area — all tabs mounted, only active one visible */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map(tab => (
          <div
            key={tab.ptyID}
            className={`absolute inset-0 ${tab.ptyID === activeTabPtyId ? '' : 'invisible pointer-events-none'}`}
          >
            <TerminalPane
              ptyID={tab.ptyID}
              title={tab.title}
              onClose={() => onCloseTab(tab.ptyID)}
              hideHeader
            />
          </div>
        ))}
      </div>

    </div>
  )
}

function WelcomePage() {
  const services = [
    { name: 'Claude', color: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/20', dot: 'bg-orange-400', tokens: null },
    { name: 'Codex', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/20', dot: 'bg-green-400', tokens: null },
    { name: 'Gemini', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20', dot: 'bg-blue-400', tokens: null },
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#090b10] select-none overflow-auto">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-12 py-16 min-h-[360px]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-2xl font-black text-white shadow-lg mb-6">
          S
        </div>
        <h1 className="text-2xl font-bold text-white/90 mb-2 tracking-tight">Welcome to Stowe</h1>
        <p className="text-sm text-white/40 text-center max-w-xs leading-relaxed">
          Your AI session manager. Open a conversation from the sidebar or start a new session.
        </p>
      </div>

      {/* Token usage section — placeholder */}
      <div className="px-10 pb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Token Usage</span>
          <div className="flex-1 h-px bg-white/[0.05]" />
          <span className="text-[10px] text-white/20">Coming soon</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {services.map(s => (
            <div
              key={s.name}
              className={`rounded-xl border ${s.border} bg-gradient-to-br ${s.color} p-4`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${s.dot} opacity-60`} />
                <span className="text-xs font-semibold text-white/60">{s.name}</span>
              </div>
              <p className="text-xl font-bold text-white/20">—</p>
              <p className="text-[10px] text-white/20 mt-1">tokens used</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
