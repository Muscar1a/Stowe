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
import {
  ArrowRightIcon,
  BranchIcon,
  FileIcon,
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
  const [filesPanelOpen, setFilesPanelOpen] = useState(false)
  useEffect(() => {
    // Close panel on session change; re-open handled by hasFiles effect
    setFilesPanelOpen(false)
  }, [session?.id])

  const hasFiles = editedFiles.length > 0
  useEffect(() => {
    if (hasFiles) setFilesPanelOpen(true)
  }, [hasFiles])

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
              <span className="font-mono text-[10px] text-text-faint shrink-0">&gt;_</span>
              <span className="truncate flex-1">{tabTitle}</span>
              <button
                onClick={e => { e.stopPropagation(); onCloseTab(tab.ptyID) }}
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded-chip text-text-faint hover:text-text-main hover:bg-bg-active opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                title="Close"
              >
                <XIcon size={10} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Thin session info bar */}
      <div className="h-9 border-b border-border-subtle px-4 flex items-center gap-2 text-xs text-text-muted shrink-0">
        {repoName && (
          <span className="flex items-center gap-1.5 text-text-faint shrink-0">
            <FolderIcon size={12} />
            {repoName}
          </span>
        )}
        {repoName && <span className="text-text-faint">/</span>}

        {editing ? (
          <input
            ref={inputRef}
            className="bg-bg-active text-text-main text-xs rounded-chip px-1.5 py-0.5 outline-none border border-accent-primary min-w-0"
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
            className="text-text-main font-medium truncate cursor-pointer transition-colors"
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
              className="text-text-faint hover:text-text-main transition-colors shrink-0"
              title="Rename"
            ><PencilIcon size={12} /></button>
            <button
              onClick={() => ToggleFavorite(session.id)}
              className={`transition-colors shrink-0 ${session.isFavorite ? 'text-accent-primary' : 'text-text-faint hover:text-text-main'}`}
              title={session.isFavorite ? 'Remove favorite' : 'Add favorite'}
            ><StarIcon size={12} filled={session.isFavorite} /></button>
          </>
        )}

        <div className="ml-auto flex items-center gap-3 font-mono text-[11px] text-text-faint shrink-0">
          {session?.gitBranch && (
            <span className="flex items-center gap-1"><BranchIcon size={11} />{session.gitBranch}</span>
          )}
          {session?.messageCount != null && (
            <span className="flex items-center gap-1"><MessageIcon size={11} />{session.messageCount}</span>
          )}
          <button
            onClick={() => setFilesPanelOpen(p => !p)}
            className={`flex items-center gap-1 transition-colors ${filesPanelOpen ? 'text-accent-primary' : 'hover:text-text-main'}`}
            title="Changed files"
          >
            <FileIcon size={11} />
            {editedFiles.length > 0 && (
              <span>{editedFiles.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Terminal area + files panel */}
      <div className="flex-1 flex overflow-hidden">
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

        {filesPanelOpen && (
          <FilesPanel
            files={editedFiles}
            gitRoot={session?.gitRoot ?? ''}
            onClose={() => setFilesPanelOpen(false)}
          />
        )}
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Changed files panel
// ---------------------------------------------------------------------------

function relPath(full: string, gitRoot: string): string {
  const norm = (p: string) => p.replace(/\\/g, '/')
  const n = norm(full), r = norm(gitRoot)
  return n.startsWith(r + '/') ? n.slice(r.length + 1) : n.split('/').pop() ?? full
}

function FilesPanel({ files, gitRoot, onClose }: { files: string[]; gitRoot: string; onClose: () => void }) {
  return (
    <div className="w-56 shrink-0 border-l border-border-subtle bg-bg-sidebar flex flex-col">
      <div className="h-9 px-3 flex items-center justify-between shrink-0 border-b border-border-subtle">
        <span className="text-xs font-semibold text-text-muted">Changed Files</span>
        <button
          onClick={onClose}
          className="text-text-faint hover:text-text-main transition-colors"
          title="Close"
        >
          <XIcon size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <p className="px-3 py-4 text-xs text-text-faint text-center">No files changed yet</p>
        ) : (
          files.map(f => {
            const rel = relPath(f, gitRoot)
            const name = rel.split('/').pop() ?? rel
            const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
            return (
              <div
                key={f}
                className="flex items-start gap-2 px-3 py-1.5 hover:bg-bg-hover transition-colors"
                title={f}
              >
                <FileIcon size={11} className="text-accent-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-text-main truncate">{name}</p>
                  {dir && <p className="text-[10px] text-text-faint truncate">{dir}</p>}
                </div>
              </div>
            )
          })
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
