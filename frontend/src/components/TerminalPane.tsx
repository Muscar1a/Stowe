import { useRef } from 'react'
import { useTerminal } from '../hooks/useTerminal'
import '@xterm/xterm/css/xterm.css'

interface Props {
  ptyID: string
  title: string
  onClose: () => void
  hideHeader?: boolean
}

export function TerminalPane({ ptyID, title, onClose, hideHeader }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { exited } = useTerminal(containerRef, ptyID)

  return (
    <div className="flex flex-col h-full bg-bg-terminal w-full">
      {/* Terminal title bar */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle shrink-0">
          <span className="text-sm text-text-muted truncate">{title}</span>
          <div className="flex items-center gap-3 shrink-0">
            {exited && (
              <span className="font-mono text-xs text-text-faint">Session ended</span>
            )}
            <button
              className="text-text-faint hover:text-text-main transition-colors text-lg leading-none"
              onClick={onClose}
              title="Close terminal"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* xterm container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden p-2"
      />
    </div>
  )
}
