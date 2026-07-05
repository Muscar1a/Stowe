import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import { WriteToTerminal, ResizeTerminal } from '../../wailsjs/go/main/App'
import { useTheme } from '../theme'

interface PTYData { id: string; data: string }
interface PTYExit { id: string; code: number }

export function useTerminal(containerRef: React.RefObject<HTMLDivElement | null>, ptyID: string | null) {
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const [exited, setExited] = useState(false)
  const { activeTheme } = useTheme()

  // Use a ref for theme so we can read it on mount without recreating the terminal session
  const themeRef = useRef(activeTheme)
  themeRef.current = activeTheme

  useEffect(() => {
    if (!containerRef.current || !ptyID) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Cascadia Code, Consolas, monospace',
      theme: {
        background: themeRef.current.terminalBg,
        foreground: themeRef.current.terminalFg,
        cursor: themeRef.current.terminalCursor,
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    term.onData(data => WriteToTerminal(ptyID, data))

    const offData = EventsOn('pty:data', (payload: PTYData) => {
      if (payload.id === ptyID) term.write(payload.data)
    })

    const offExit = EventsOn('pty:exit', (payload: PTYExit) => {
      if (payload.id === ptyID) setExited(true)
    })

    const observer = new ResizeObserver(() => {
      fit.fit()
      const { cols, rows } = term
      ResizeTerminal(ptyID, cols, rows)
    })
    observer.observe(containerRef.current)

    return () => {
      offData()
      offExit()
      observer.disconnect()
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [ptyID])

  // Dynamically update theme options when user switches theme
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = {
        background: activeTheme.terminalBg,
        foreground: activeTheme.terminalFg,
        cursor: activeTheme.terminalCursor,
      }
    }
  }, [activeTheme])

  return { exited }
}

