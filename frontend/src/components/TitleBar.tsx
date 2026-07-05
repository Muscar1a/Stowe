import { useState } from 'react'
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../wailsjs/runtime/runtime'
import type { CSSProperties } from 'react'

interface Props {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  canGoBack: boolean
  canGoForward: boolean
  onGoBack: () => void
  onGoForward: () => void
}

// Wails frameless window: elements with --wails-draggable:drag act as the
// title bar; interactive children must opt out with no-drag.
const drag = { '--wails-draggable': 'drag' } as CSSProperties
const noDrag = { '--wails-draggable': 'no-drag' } as CSSProperties

export function TitleBar({ sidebarCollapsed, onToggleSidebar, canGoBack, canGoForward, onGoBack, onGoForward }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="relative h-9 flex items-stretch bg-bg-sidebar border-b border-border-subtle select-none shrink-0"
      style={drag}
    >
      {/* Left: app menu + sidebar toggle + navigation */}
      <div className="flex items-center gap-1 px-2" style={noDrag}>
        <button
          onClick={() => setMenuOpen(open => !open)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
            menuOpen ? 'bg-white/[0.1] text-white' : 'text-white/45 hover:text-white/90 hover:bg-white/[0.07]'
          }`}
          title="Menu"
        >
          <MenuIcon />
        </button>
        <button
          onClick={onToggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/45 hover:text-white/90 hover:bg-white/[0.07] transition-colors"
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          <SidebarIcon collapsed={sidebarCollapsed} />
        </button>
        <button
          onClick={onGoBack}
          disabled={!canGoBack}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/45 hover:text-white/90 hover:bg-white/[0.07] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/45 disabled:cursor-default"
          title="Go back"
        >
          <BackIcon />
        </button>
        <button
          onClick={onGoForward}
          disabled={!canGoForward}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/45 hover:text-white/90 hover:bg-white/[0.07] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/45 disabled:cursor-default"
          title="Go forward"
        >
          <ForwardIcon />
        </button>
      </div>

      {/* Middle: drag region */}
      <div className="flex-1" />

      {/* Right: window controls */}
      <div className="flex items-stretch" style={noDrag}>
        <button
          onClick={() => WindowMinimise()}
          className="w-11 flex items-center justify-center text-white/45 hover:text-white/90 hover:bg-white/[0.07] transition-colors"
          title="Minimize"
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={() => WindowToggleMaximise()}
          className="w-11 flex items-center justify-center text-white/45 hover:text-white/90 hover:bg-white/[0.07] transition-colors"
          title="Maximize"
        >
          <MaximizeIcon />
        </button>
        <button
          onClick={() => Quit()}
          className="w-11 flex items-center justify-center text-white/45 hover:text-white hover:bg-[#e81123] transition-colors"
          title="Close"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Dropdown menu (placeholder) */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute left-2 top-full mt-1 z-50 w-48 rounded-lg border border-border-subtle bg-bg-sidebar shadow-xl py-1"
            style={noDrag}
          >
            <p className="px-3 py-2 text-xs text-white/30">Nothing here yet</p>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Icons — inline SVGs so they stay crisp and aligned across platforms
// (text glyphs render inconsistently). All follow currentColor.
// ---------------------------------------------------------------------------

function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <line x1="2" y1="3.5" x2="12" y2="3.5" />
      <line x1="2" y1="7" x2="12" y2="7" />
      <line x1="2" y1="10.5" x2="12" y2="10.5" />
    </svg>
  )
}

function SidebarIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" />
      <line x1="5.5" y1="2.5" x2="5.5" y2="11.5" />
      {/* Left pane filled while the sidebar is visible */}
      {!collapsed && <path d="M3 2.5h2.5v9H3a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 3 2.5Z" fill="currentColor" stroke="none" />}
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 3 4 7l4.5 4" />
    </svg>
  )
}

function ForwardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 3 10 7l-4.5 4" />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
      <line x1="0.5" y1="5.5" x2="9.5" y2="5.5" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
      <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" />
      <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" />
    </svg>
  )
}
