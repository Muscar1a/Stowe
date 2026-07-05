import { ToggleFavorite } from '../../wailsjs/go/main/App'
import { sessionTitle } from '../hooks/useSessions'
import { useSessionRename } from '../hooks/useSessionRename'
import type { Session } from '../hooks/useSessions'

interface Props {
  session: Session
  isSelected?: boolean
  onOpen: (session: Session) => void
}

export function SessionCard({ session, isSelected, onOpen }: Props) {
  const { editing, draftName, setDraftName, inputRef, startRename, commitRename, cancelRename } = useSessionRename(session)

  const displayTitle = sessionTitle(session, 'Untitled Session')
  const date = session.updatedAt
    ? formatRelative(new Date(session.updatedAt))
    : 'just now'

  // Determine agent badge info
  const badgeInfo = getBadgeInfo(session)

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    ToggleFavorite(session.id)
  }

  return (
    <div
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? 'bg-white/[0.08] border border-white/[0.08] shadow-sm'
          : 'hover:bg-white/[0.04] border border-transparent'
      }`}
      onClick={() => onOpen(session)}
    >
      {/* Agent Badge */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-[11px] border mt-0.5 ${badgeInfo.className}`}
      >
        {badgeInfo.label}
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="w-full bg-white/10 text-white text-sm rounded px-1.5 py-0.5 outline-none border border-accent-primary"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') cancelRename()
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center justify-between gap-1">
            <p
              className="text-sm font-medium text-white/90 group-hover:text-white truncate transition-colors"
              onDoubleClick={e => { e.stopPropagation(); startRename() }}
              title={displayTitle}
            >
              {displayTitle}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-white/40">{date}</p>
        </div>
      </div>

      <button
        className={`shrink-0 text-sm mt-1 transition-opacity ${
          session.isFavorite
            ? 'opacity-100 text-yellow-400'
            : 'opacity-0 group-hover:opacity-60 text-white/40 hover:text-white'
        }`}
        onClick={handleFavorite}
        title={session.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        ★
      </button>
    </div>
  )
}

function getBadgeInfo(session: Session): { label: string; className: string } {
  const type = (session.agentType || session.title || '').toLowerCase()
  if (type.includes('claude') || type.includes('cc') || type.includes('build') || type.includes('refactor') || type.includes('xor')) {
    return {
      label: 'CC',
      className: 'bg-[#2a1717]/80 border-[#5c2828] text-[#f87171]',
    }
  }
  if (type.includes('gemini') || type.includes('ge') || type.includes('explain')) {
    return {
      label: 'GE',
      className: 'bg-[#162032]/80 border-[#233858] text-[#60a5fa]',
    }
  }
  return {
    label: 'AI',
    className: 'bg-[#132820]/80 border-[#1b4d3e] text-[#34d399]',
  }
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  if (hrs === 1) return `about 1 hour ago`
  if (hrs < 24) return `about ${hrs} hours ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return `1 day ago`
  if (days < 30) return `${days} days ago`
  return date.toLocaleDateString()
}
