import { useState } from 'react'
import { DeleteSession, ToggleFavorite } from '../../wailsjs/go/main/App'
import { sessionTitle } from '../hooks/useSessions'
import { useSessionRename } from '../hooks/useSessionRename'
import type { Session } from '../hooks/useSessions'
import { DotsIcon, StarIcon } from './icons'

interface Props {
  session: Session
  isSelected?: boolean
  onOpen: (session: Session) => void
}

export function SessionCard({ session, isSelected, onOpen }: Props) {
  const { editing, draftName, setDraftName, inputRef, startRename, commitRename, cancelRename } = useSessionRename(session)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
    setConfirmDelete(false)
  }

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
      className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-card cursor-pointer transition-colors ${
        isSelected
          ? 'bg-bg-active border border-border-subtle'
          : 'hover:bg-bg-raised border border-transparent'
      }`}
      onClick={() => onOpen(session)}
    >
      {/* Agent Badge */}
      <div
        className={`w-7 h-7 rounded-chip flex items-center justify-center shrink-0 font-mono font-semibold text-[10px] border mt-0.5 ${badgeInfo.className}`}
      >
        {badgeInfo.label}
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="w-full bg-bg-active text-text-main text-sm rounded-chip px-1.5 py-0.5 outline-none border border-accent-primary"
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
              className="text-sm font-medium text-text-main truncate"
              onDoubleClick={e => { e.stopPropagation(); startRename() }}
              title={displayTitle}
            >
              {displayTitle}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="font-mono text-[10px] text-text-faint">{date}</p>
        </div>
      </div>

      <button
        className={`shrink-0 mt-1 transition-opacity ${
          session.isFavorite
            ? 'opacity-100 text-accent-primary'
            : 'opacity-0 group-hover:opacity-60 text-text-faint hover:text-text-main'
        }`}
        onClick={handleFavorite}
        title={session.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <StarIcon size={13} filled={session.isFavorite} />
      </button>

      {/* More options (⋮) */}
      <button
        className={`shrink-0 mt-1 transition-opacity ${
          menuOpen ? 'opacity-100 text-text-main' : 'opacity-0 group-hover:opacity-60 text-text-faint hover:text-text-main'
        }`}
        onClick={e => { e.stopPropagation(); menuOpen ? closeMenu() : setMenuOpen(true) }}
        title="More options"
      >
        <DotsIcon size={13} />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={e => { e.stopPropagation(); closeMenu() }} />
          <div
            className="absolute right-2 top-10 z-50 w-44 rounded-card border border-border-subtle bg-bg-tabbar shadow-xl py-1"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-text-muted hover:text-text-main hover:bg-bg-hover"
              onClick={() => { closeMenu(); startRename() }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-bg-hover"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true)
                  return
                }
                closeMenu()
                DeleteSession(session.id)
              }}
            >
              {confirmDelete ? 'Click again to confirm' : 'Delete Conversation'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function getBadgeInfo(session: Session): { label: string; className: string } {
  const type = (session.agentType || session.title || '').toLowerCase()
  if (type.includes('claude') || type.includes('cc') || type.includes('build') || type.includes('refactor') || type.includes('xor')) {
    return {
      label: 'CC',
      className: 'bg-red-400/10 border-red-400/25 text-red-400',
    }
  }
  if (type.includes('gemini') || type.includes('ge') || type.includes('explain')) {
    return {
      label: 'GE',
      className: 'bg-blue-400/10 border-blue-400/25 text-blue-400',
    }
  }
  return {
    label: 'AI',
    className: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400',
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
