import { useState } from 'react'
import type { RepoGroup, Session } from '../hooks/useSessions'
import type { AppMode } from '../App'
import { SelectProjectFolder } from '../../wailsjs/go/main/App'
import {
  HomeIcon,
  CodeIcon,
  PlusIcon,
  BoxIcon,
  WandIcon,
  ChevronDownIcon,
  GearIcon,
  FolderIcon,
  SearchIcon,
  SparkIcon
} from './icons'

interface Props {
  repoGroups: RepoGroup[]
  sessions: Session[]
  selectedSession: Session | null
  onSelectSession: (session: Session) => void
  searchQuery: string
  onSearch: (q: string) => void
  onNewChat: (gitRoot?: string) => void
  mode: AppMode
  onSelectMode: (mode: AppMode) => void
  activeRepoRoot: string | null
  onSelectRepo: (gitRoot: string | null) => void
  onOpenHub: () => void
}

const norm = (p?: string | null) => p ? p.replace(/\\/g, '/').toLowerCase().replace(/\/$/, '') : ''

export function Sidebar({
  repoGroups,
  sessions,
  selectedSession,
  onSelectSession,
  onNewChat,
  mode,
  onSelectMode,
  activeRepoRoot,
  onSelectRepo,
}: Props) {
  const [showMore, setShowMore] = useState(false)

  const activeSessions = activeRepoRoot
    ? sessions.filter(s => {
        const sRoot = norm(s.gitRoot) || norm(s.cwd)
        const target = norm(activeRepoRoot)
        return sRoot === target || sRoot.endsWith('/' + target) || target.endsWith('/' + sRoot)
      })
    : []

  return (
    <div className="w-[260px] h-full flex flex-col bg-bg-sidebar text-text-main font-sans shrink-0 border-r border-border-subtle">
      
      {/* Top Navigation Switcher */}
      <div className="p-3 pb-2">
        <div className="flex bg-bg-raised border border-border-subtle rounded-full p-0.5">
          <button
            onClick={() => onSelectMode('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'chat'
                ? 'bg-bg-hover text-text-main shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <HomeIcon size={14} />
            <span>Home</span>
          </button>
          <button
            onClick={() => onSelectMode('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-xs font-medium transition-colors ${
              mode === 'code'
                ? 'bg-bg-hover text-text-main shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <CodeIcon size={14} />
            <span>Code</span>
          </button>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="px-3 py-2 flex flex-col gap-0.5">
        <SidebarItem
          icon={<PlusIcon size={14} />}
          label="New"
          onClick={() => onNewChat(activeRepoRoot ?? undefined)}
          active={false}
        />
        <SidebarItem
          icon={<BoxIcon size={14} />}
          label="Artifacts"
          onClick={() => {}}
          active={false}
        />
        <SidebarItem
          icon={<WandIcon size={14} />}
          label="Customize"
          onClick={() => {}}
          active={false}
        />
        <SidebarItem
          icon={<ChevronDownIcon size={14} className={showMore ? "rotate-180 transition-transform" : "transition-transform"} />}
          label="More"
          onClick={() => setShowMore(!showMore)}
          active={false}
        />
      </div>

      {/* Projects Section / Explorer */}
      <div className="flex-1 overflow-y-auto px-3 py-4 mt-2">
        
        {activeRepoRoot ? (
          // FOLDER OPENED STATE
          <>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider truncate">
                {activeRepoRoot.split(/[/\\]/).pop() || 'WORKSPACE'}
              </span>
            </div>
            
            <div className="flex flex-col gap-0.5 mt-2">
              {/* Filter sessions for active repo */}
              {activeSessions.length > 0 ? (
                activeSessions.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => onSelectSession(s)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-control text-xs text-left truncate transition-colors ${
                      selectedSession?.id === s.id
                        ? 'bg-bg-active text-text-main font-medium'
                        : 'text-text-muted hover:text-text-main hover:bg-bg-hover'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
                    <span className="truncate">{s.customName || s.title || 'Untitled Session'}</span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-text-faint px-2 py-2">No active sessions.</p>
              )}
            </div>
          </>
        ) : (
          // NO FOLDER OPENED STATE
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <ChevronDownIcon size={10} className="text-text-faint" />
                NO FOLDER OPENED
              </span>
            </div>
            
            <div className="px-2 py-2 space-y-4">
              <p className="text-xs text-text-muted leading-relaxed">
                You have not yet opened a folder.
              </p>
              <button 
                className="w-full bg-accent-primary text-white hover:opacity-90 active:opacity-100 transition-opacity rounded-md py-1.5 text-xs font-medium"
                onClick={async () => {
                  try {
                    const dir = await SelectProjectFolder()
                    if (dir) onSelectRepo(dir)
                  } catch (err) {
                    console.error('Failed to select folder:', err)
                  }
                }}
              >
                Open Folder
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Project List (if any exist globally) */}
        {!activeRepoRoot && repoGroups.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <ChevronDownIcon size={10} className="text-text-faint" />
                RECENT WORKSPACES
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              {repoGroups.map(group => (
                <button
                  key={group.gitRoot}
                  onClick={() => onSelectRepo(group.gitRoot)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-control text-xs text-left truncate transition-colors text-text-muted hover:text-text-main hover:bg-bg-hover"
                >
                  <FolderIcon size={12} className="shrink-0" />
                  <span className="truncate">{group.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Profile */}
      <div className="p-3 border-t border-border-subtle shrink-0">
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-control hover:bg-bg-hover transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-text-muted text-bg-main flex items-center justify-center text-[10px] font-bold">
              AN
            </div>
            <div className="text-xs font-medium text-text-main">
              Musc <span className="text-text-faint font-normal">· Pro</span>
            </div>
            <ChevronDownIcon size={12} className="text-text-faint" />
          </div>
          <SparkIcon size={14} className="text-text-faint" />
        </button>
      </div>

    </div>
  )
}

function SidebarItem({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick: () => void, active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-control text-sm transition-colors ${
        active
          ? 'bg-bg-active text-text-main font-medium'
          : 'text-text-muted hover:text-text-main hover:bg-bg-hover'
      }`}
    >
      <div className={active ? 'text-text-main' : 'text-text-muted'}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  )
}

