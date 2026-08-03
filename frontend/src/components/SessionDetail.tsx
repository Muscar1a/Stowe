import { useEffect, useState } from 'react'
import { ToggleFavorite, GetSessionEditedFiles } from '../../wailsjs/go/main/App'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import { sessionTitle } from '../hooks/useSessions'
import { useSessionRename } from '../hooks/useSessionRename'
import type { ReactNode } from 'react'
import type { Session, RepoGroup } from '../hooks/useSessions'
import type { TabEntry } from '../App'
import { TerminalPane } from './TerminalPane'
import { Starburst } from './Starburst'
import { InspectorPanel } from './InspectorPanel'
import {
  ArrowRightIcon,
  BranchIcon,
  FolderIcon,
  HexIcon,
  MessageIcon,
  PencilIcon,
  SparkIcon,
  StarIcon,
  XIcon,
} from './icons'

function useEditedFiles(sessionID: string | null): string[] {
  const [files, setFiles] = useState<string[]>([])
  useEffect(() => {
    if (!sessionID) { setFiles([]); return }
    GetSessionEditedFiles(sessionID).then(r => setFiles(r ?? []))
    const off = EventsOn('session:updated', (s: any) => {
      if (s?.id === sessionID) {
        GetSessionEditedFiles(sessionID).then(r => setFiles(r ?? []))
      }
    })
    return off
  }, [sessionID])
  return files
}

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
  const editedFiles = useEditedFiles(session?.id ?? null)
  const [inspectorOpen, setInspectorOpen] = useState(true)

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
    <div className="flex-1 flex flex-col bg-bg-main overflow-hidden text-text-main min-w-0">

      {/* Top Header: Integrated Tab bar & Workspace Control */}
      <div className="flex items-center justify-between bg-bg-tabbar border-b border-border-subtle shrink-0">
        {/* Tab strip */}
        <div className="flex items-stretch overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => {
            const tabSession = allSessions.find(s => s.id === tab.sessionID)
            const tabTitle = tabSession ? sessionTitle(tabSession) : tab.title
            const isActive = tab.ptyID === activeTabPtyId

            return (
              <div
                key={tab.ptyID}
                onClick={() => onSelectTab(tab.ptyID)}
                className={`group flex items-center gap-2 px-3.5 py-2 text-xs cursor-pointer shrink-0 border-r border-border-subtle select-none max-w-[200px] transition-colors ${
                  isActive
                    ? 'bg-bg-main text-text-main font-medium border-t-[2px] border-t-accent-primary'
                    : 'text-text-faint hover:text-text-muted hover:bg-bg-hover border-t-[2px] border-t-transparent'
                }`}
              >
                <span className="font-mono text-[10px] text-text-faint shrink-0">&gt;_</span>
                <span className="truncate flex-1">{tabTitle}</span>
                <button
                  onClick={e => { e.stopPropagation(); onCloseTab(tab.ptyID) }}
                  className="shrink-0 w-4 h-4 flex items-center justify-center rounded-chip text-text-faint hover:text-text-main hover:bg-bg-active opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                  title="Close Tab"
                >
                  <XIcon size={10} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Header Right Action Bar */}
        <div className="flex items-center gap-3 px-3 shrink-0 font-mono text-[11px] text-text-faint">
          {session?.gitBranch && (
            <span className="flex items-center gap-1">
              <BranchIcon size={11} />
              <span>{session.gitBranch}</span>
            </span>
          )}
          <button
            onClick={() => setInspectorOpen(p => !p)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-control text-xs transition-colors border ${
              inspectorOpen
                ? 'bg-bg-raised border-border-subtle text-text-main font-medium'
                : 'border-transparent text-text-faint hover:text-text-main hover:bg-bg-hover'
            }`}
            title="Toggle Right Inspector"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
            <span className="font-sans">Inspector</span>
          </button>
        </div>
      </div>

      {/* Main Studio Content Area (Center Terminal + Right Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal & Bottom Graph Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 relative overflow-hidden bg-bg-terminal">
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

        {/* Option B: Right Inspector Sidebar */}
        {inspectorOpen && (
          <InspectorPanel
            session={session}
            repoGroups={repoGroups}
            editedFiles={editedFiles}
            onClose={() => setInspectorOpen(false)}
          />
        )}
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
    icon: <HexIcon size={18} className="text-green-400" />,
    available: false,
  },
  {
    name: 'Gemini CLI',
    desc: 'Google Gemini terminal sessions',
    icon: <SparkIcon size={18} className="text-blue-400" />,
    available: false,
  },
]

const API_CHAT: LauncherOption = {
  name: 'Chat via API',
  desc: 'Regular conversations using your own API key',
  icon: <MessageIcon size={18} className="text-indigo-400" />,
  available: false,
}

// Feature flag: API Chat is not ready yet — hide its entry point in the UI.
const SHOW_API_CHAT = false

function NewSessionPage({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-bg-main select-none overflow-auto px-10 py-12">
      <div className="w-full max-w-xl">
        <h1 className="text-xl font-semibold text-text-main mb-1 tracking-tight">Start a new session</h1>
        <p className="text-sm text-text-faint mb-8">Pick how you want to chat.</p>

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
      <span className="font-mono text-[10px] font-semibold text-text-faint uppercase tracking-widest">{label}</span>
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
      className={`w-full flex items-center gap-3.5 rounded-card border px-4 py-3.5 text-left transition-colors ${
        available
          ? 'border-border-subtle bg-bg-raised hover:bg-bg-hover cursor-pointer'
          : 'border-border-subtle opacity-60 cursor-default'
      }`}
    >
      <div className="w-9 h-9 rounded-control bg-bg-hover flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-main">{name}</p>
        <p className="text-xs text-text-faint truncate">{desc}</p>
      </div>
      {available ? (
        <ArrowRightIcon size={13} className="text-text-faint shrink-0" />
      ) : (
        <span className="font-mono text-[10px] font-medium text-text-faint bg-bg-hover border border-border-subtle rounded-chip px-2 py-0.5 shrink-0 uppercase tracking-wide">
          Upcoming
        </span>
      )}
    </button>
  )
}
