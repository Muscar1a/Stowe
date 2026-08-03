import { useState } from 'react'
import { ToggleFavorite } from '../../wailsjs/go/main/App'
import { sessionTitle } from '../hooks/useSessions'
import { useSessionRename } from '../hooks/useSessionRename'
import type { Session, RepoGroup } from '../hooks/useSessions'
import {
  BranchIcon,
  FileIcon,
  FolderIcon,
  MessageIcon,
  PencilIcon,
  StarIcon,
  XIcon,
} from './icons'

interface Props {
  session: Session | null
  repoGroups: RepoGroup[]
  editedFiles: string[]
  onClose: () => void
}

export function InspectorPanel({
  session,
  repoGroups,
  editedFiles,
  onClose,
}: Props) {
  const { editing, draftName, setDraftName, inputRef, startRename, commitRename, cancelRename } =
    useSessionRename(session)

  const repoGroup = session ? repoGroups.find(g => g.gitRoot === session.gitRoot) : null
  const repoName = repoGroup?.displayName || session?.gitRoot?.split(/[/\\]/).pop() || ''
  const displayTitle = session ? sessionTitle(session) : 'Terminal Session'

  const badgeInfo = getBadgeInfo(session)

  return (
    <div className="w-[260px] shrink-0 border-l border-border-subtle bg-bg-sidebar flex flex-col h-full select-none text-text-main">
      {/* Inspector Header */}
      <div className="h-9 px-3 flex items-center justify-between shrink-0 border-b border-border-subtle">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-accent-primary" />
          <span>Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-control text-text-faint hover:text-text-main hover:bg-bg-hover transition-colors"
          title="Close Inspector"
        >
          <XIcon size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Session Card & Meta */}
        <div className="bg-bg-raised border border-border-subtle rounded-card p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className={`w-7 h-7 rounded-chip flex items-center justify-center shrink-0 font-mono font-semibold text-[10px] border ${badgeInfo.className}`}
              >
                {badgeInfo.label}
              </span>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <input
                    ref={inputRef}
                    className="w-full bg-bg-active text-text-main text-xs rounded-chip px-1.5 py-0.5 outline-none border border-accent-primary"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') cancelRename()
                    }}
                  />
                ) : (
                  <h3
                    className="text-xs font-semibold text-text-main truncate cursor-pointer hover:text-accent-primary transition-colors"
                    onDoubleClick={startRename}
                    title="Double-click to rename"
                  >
                    {displayTitle}
                  </h3>
                )}
                {repoName && (
                  <p className="text-[10px] text-text-faint flex items-center gap-1 truncate mt-0.5">
                    <FolderIcon size={10} className="shrink-0" />
                    <span className="truncate">{repoName}</span>
                  </p>
                )}
              </div>
            </div>

            {session && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={startRename}
                  className="w-6 h-6 flex items-center justify-center rounded-control text-text-faint hover:text-text-main hover:bg-bg-hover transition-colors"
                  title="Rename session"
                >
                  <PencilIcon size={11} />
                </button>
                <button
                  onClick={() => ToggleFavorite(session.id)}
                  className={`w-6 h-6 flex items-center justify-center rounded-control transition-colors ${
                    session.isFavorite
                      ? 'text-accent-primary'
                      : 'text-text-faint hover:text-text-main hover:bg-bg-hover'
                  }`}
                  title={session.isFavorite ? 'Remove favorite' : 'Add favorite'}
                >
                  <StarIcon size={11} filled={session.isFavorite} />
                </button>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle font-mono text-[10px]">
            <div className="bg-bg-hover/50 rounded-chip p-2 flex flex-col gap-0.5">
              <span className="text-text-faint flex items-center gap-1">
                <BranchIcon size={10} /> Branch
              </span>
              <span className="text-text-main font-medium truncate">
                {session?.gitBranch || 'main'}
              </span>
            </div>
            <div className="bg-bg-hover/50 rounded-chip p-2 flex flex-col gap-0.5">
              <span className="text-text-faint flex items-center gap-1">
                <MessageIcon size={10} /> Messages
              </span>
              <span className="text-text-main font-medium">
                {session?.messageCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Changed Files Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[10px] font-semibold text-text-faint uppercase tracking-wider flex items-center gap-1.5">
              <FileIcon size={11} />
              <span>Changed Files ({editedFiles.length})</span>
            </span>
          </div>

          <div className="bg-bg-raised border border-border-subtle rounded-card overflow-hidden divide-y divide-border-subtle">
            {editedFiles.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-text-faint">No files modified yet</p>
              </div>
            ) : (
              editedFiles.map(f => {
                const rel = relPath(f, session?.gitRoot ?? '')
                const name = rel.split('/').pop() ?? rel
                const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : ''
                return (
                  <div
                    key={f}
                    className="flex items-start gap-2 px-3 py-2 hover:bg-bg-hover transition-colors group cursor-default"
                    title={f}
                  >
                    <FileIcon size={11} className="text-accent-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-main font-medium truncate">{name}</p>
                      {dir && <p className="text-[10px] text-text-faint truncate">{dir}</p>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function relPath(full: string, gitRoot: string): string {
  const norm = (p: string) => p.replace(/\\/g, '/')
  const n = norm(full), r = norm(gitRoot)
  return n.startsWith(r + '/') ? n.slice(r.length + 1) : n.split('/').pop() ?? full
}

function getBadgeInfo(session: Session | null): { label: string; className: string } {
  if (!session) return { label: 'AI', className: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400' }
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
