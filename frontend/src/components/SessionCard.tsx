import { useState, useRef } from 'react'
import { RenameSession, ToggleFavorite } from '../../wailsjs/go/main/App'
import type { Session } from '../hooks/useSessions'

interface Props {
  session: Session
  onOpen: (session: Session) => void
}

export function SessionCard({ session, onOpen }: Props) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const displayTitle = session.customName || session.title || 'Untitled'
  const date = session.updatedAt
    ? formatRelative(new Date(session.updatedAt))
    : ''

  function startRename() {
    setDraftName(session.customName || session.title || '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitRename() {
    setEditing(false)
    const name = draftName.trim()
    if (name && name !== (session.customName || session.title)) {
      RenameSession(session.id, name)
    }
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    ToggleFavorite(session.id)
  }

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
      onClick={() => onOpen(session)}
    >
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            className="w-full bg-white/10 text-white text-sm rounded px-1.5 py-0.5 outline-none border border-blue-500"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') setEditing(false)
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <p
            className="text-sm text-white/90 truncate"
            onDoubleClick={e => { e.stopPropagation(); startRename() }}
          >
            {displayTitle}
          </p>
        )}
        <p className="text-xs text-white/40 mt-0.5">{date}</p>
      </div>

      <button
        className={`shrink-0 text-sm mt-0.5 transition-opacity ${
          session.isFavorite ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-60 text-white/60'
        }`}
        onClick={handleFavorite}
        title={session.isFavorite ? 'Unfavorite' : 'Favorite'}
      >
        ★
      </button>
    </div>
  )
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}
