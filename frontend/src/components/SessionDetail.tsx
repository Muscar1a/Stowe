import { ToggleFavorite } from '../../wailsjs/go/main/App'
import { sessionTitle } from '../hooks/useSessions'
import { useSessionRename } from '../hooks/useSessionRename'
import type { ReactNode } from 'react'
import type { Session, RepoGroup } from '../hooks/useSessions'
import type { TabEntry } from '../App'
import { TerminalPane } from './TerminalPane'
import { Starburst } from './Starburst'

interface Props {
  session: Session | null
  repoGroups: RepoGroup[]
  tabs: TabEntry[]
  activeTabPtyId: string | null
  showHome: boolean
  onSelectTab: (ptyID: string) => void
  onCloseTab: (ptyID: string) => void
  onNewChat: () => void
}

export function SessionDetail({ session, repoGroups, tabs, activeTabPtyId, showHome, onSelectTab, onCloseTab, onNewChat }: Props) {
  const { editing, draftName, setDraftName, inputRef, startRename, commitRename, cancelRename } = useSessionRename(session)

  if (tabs.length === 0 || showHome) {
    return <NewSessionPage onNewChat={onNewChat} />
  }

  const allSessions = repoGroups.flatMap(g => g.sessions)
  const repoGroup = session ? repoGroups.find(g => g.gitRoot === session.gitRoot) : null
  const repoName = repoGroup?.displayName || session?.gitRoot?.split(/[/\\]/).pop() || ''
  const displayTitle = session
    ? sessionTitle(session)
    : (tabs.find(t => t.ptyID === activeTabPtyId)?.title ?? 'Terminal')

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-hidden text-white min-w-0">

      {/* Tab bar */}
      <div className="flex items-stretch bg-bg-tabbar border-b border-border-subtle overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const tabSession = allSessions.find(s => s.id === tab.sessionID)
          const tabTitle = tabSession ? sessionTitle(tabSession) : tab.title
          const isActive = tab.ptyID === activeTabPtyId

          return (
            <div
              key={tab.ptyID}
              onClick={() => onSelectTab(tab.ptyID)}
              className={`group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer shrink-0 border-r border-border-subtle select-none max-w-[180px] transition-colors ${
                isActive
                  ? 'bg-bg-main text-white/90 border-t-[1.5px] border-t-accent-primary'
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
      <div className="h-9 border-b border-border-subtle px-4 flex items-center gap-2 text-xs text-white/50 shrink-0 bg-white/[0.01]">
        {repoName && <span className="text-white/35 shrink-0">📁 {repoName}</span>}
        {repoName && <span className="text-white/20">/</span>}

        {editing ? (
          <input
            ref={inputRef}
            className="bg-white/10 text-white text-xs rounded px-1.5 py-0.5 outline-none border border-accent-primary min-w-0"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') cancelRename()
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

// ---------------------------------------------------------------------------
// New-session launcher page (default view when no tabs are open)
// ---------------------------------------------------------------------------

interface LauncherOption {
  name: string
  desc: string
  icon: ReactNode
  /** When false, the card is disabled and shows an "Upcoming" badge. */
  available: boolean
}

// To enable a tool once the backend supports launching it, flip `available`
// and wire its launch handler in NewSessionPage.
const CLI_TOOLS: LauncherOption[] = [
  {
    name: 'Claude Code',
    desc: 'Launch a new Claude Code session in the terminal',
    icon: <Starburst size={22} className="text-orange-400" />,
    available: true,
  },
  {
    name: 'Codex CLI',
    desc: 'OpenAI Codex terminal sessions',
    icon: <span className="text-lg leading-none text-green-400">⬢</span>,
    available: false,
  },
  {
    name: 'Gemini CLI',
    desc: 'Google Gemini terminal sessions',
    icon: <span className="text-lg leading-none text-blue-400">✦</span>,
    available: false,
  },
]

const API_CHAT: LauncherOption = {
  name: 'Chat via API',
  desc: 'Regular conversations using your own API key',
  icon: <span className="text-lg leading-none text-indigo-400">💬</span>,
  available: false,
}

// Feature flag: API Chat is not ready yet — hide its entry point in the UI.
const SHOW_API_CHAT = false

function NewSessionPage({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-main select-none overflow-auto px-10 py-12">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-bold text-white/90 mb-1 tracking-tight">Start a new session</h1>
        <p className="text-sm text-white/40 mb-8">Pick how you want to chat.</p>

        <SectionHeading label="Code CLI" />
        <div className="space-y-2 mb-8">
          {CLI_TOOLS.map(tool => (
            <LauncherCard key={tool.name} option={tool} onLaunch={onNewChat} />
          ))}
        </div>

        {SHOW_API_CHAT && (
          <>
            <SectionHeading label="API Chat" />
            <LauncherCard option={API_CHAT} onLaunch={onNewChat} />
          </>
        )}
      </div>
    </div>
  )
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  )
}

function LauncherCard({ option, onLaunch }: { option: LauncherOption; onLaunch: () => void }) {
  const { name, desc, icon, available } = option

  return (
    <button
      onClick={available ? onLaunch : undefined}
      disabled={!available}
      className={`w-full flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all ${
        available
          ? 'border-border-subtle bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.15] cursor-pointer'
          : 'border-border-subtle bg-white/[0.01] opacity-60 cursor-default'
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white/85">{name}</p>
        <p className="text-xs text-white/35 truncate">{desc}</p>
      </div>
      {available ? (
        <span className="text-white/25 text-sm shrink-0">→</span>
      ) : (
        <span className="text-[10px] font-semibold text-white/40 bg-white/[0.06] border border-white/[0.08] rounded-full px-2 py-0.5 shrink-0">
          Upcoming
        </span>
      )}
    </button>
  )
}
