import type { Session, RepoGroup } from '../hooks/useSessions'
import type { TabEntry } from '../App'
import { WelcomePage } from './WelcomePage'
import { TerminalPane } from './TerminalPane'

interface Props {
  session: Session | null
  repoGroups: RepoGroup[]
  sessions: Session[]
  tabs: TabEntry[]
  activeTabPtyId: string | null
  showHome: boolean
  onSelectTab: (ptyID: string) => void
  onCloseTab: (ptyID: string) => void
  onNewChat: (gitRoot?: string) => void
  onSelectRepo: (gitRoot: string | null) => void
  onOpenSession: (session: Session) => void
  onOpenHome?: () => void
}

export function SessionDetail({ tabs, activeTabPtyId, showHome, onSelectTab, onCloseTab, onNewChat }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Tab bar — only when tabs exist */}
      {tabs.length > 0 && (
        <div className="flex items-center gap-0.5 px-2 h-9 bg-bg-tabbar border-b border-border-subtle shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.ptyID}
              onClick={() => onSelectTab(tab.ptyID)}
              className={`flex items-center gap-2 px-3 h-7 rounded-control text-xs shrink-0 transition-colors ${
                tab.ptyID === activeTabPtyId && !showHome
                  ? 'bg-bg-active text-text-main'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-hover'
              }`}
            >
              <span className="max-w-32 truncate">{tab.title}</span>
              <span
                className="text-text-faint hover:text-text-main leading-none"
                onClick={e => { e.stopPropagation(); onCloseTab(tab.ptyID) }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Content — all panels mounted simultaneously, show/hide to preserve terminal state */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={showHome ? 'contents' : 'hidden'}>
          <WelcomePage onNewChat={onNewChat} />
        </div>
        {tabs.map(tab => (
          <div
            key={tab.ptyID}
            className={tab.ptyID === activeTabPtyId && !showHome ? 'flex-1 overflow-hidden' : 'hidden'}
          >
            <TerminalPane ptyID={tab.ptyID} title={tab.title} onClose={() => onCloseTab(tab.ptyID)} hideHeader />
          </div>
        ))}
      </div>
    </div>
  )
}
