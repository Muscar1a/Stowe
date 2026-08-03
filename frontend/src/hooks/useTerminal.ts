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

  const themeRef = useRef(activeTheme)
  themeRef.current = activeTheme

  useEffect(() => {
    if (!containerRef.current || !ptyID) return

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13.5,
      lineHeight: 1.35,
      letterSpacing: 0.3,
      fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, ui-monospace, monospace',
      theme: {
        background: themeRef.current.terminalBg,
        foreground: themeRef.current.terminalFg,
        cursor: themeRef.current.terminalCursor,
        cursorAccent: themeRef.current.terminalCursorAccent,
        selectionBackground: themeRef.current.terminalSelection,
        black: themeRef.current.black,
        red: themeRef.current.red,
        green: themeRef.current.green,
        yellow: themeRef.current.yellow,
        blue: themeRef.current.blue,
        magenta: themeRef.current.magenta,
        cyan: themeRef.current.cyan,
        white: themeRef.current.white,
        brightBlack: themeRef.current.brightBlack,
        brightRed: themeRef.current.brightRed,
        brightGreen: themeRef.current.brightGreen,
        brightYellow: themeRef.current.brightYellow,
        brightBlue: themeRef.current.brightBlue,
        brightMagenta: themeRef.current.brightMagenta,
        brightCyan: themeRef.current.brightCyan,
        brightWhite: themeRef.current.brightWhite,
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
        cursorAccent: activeTheme.terminalCursorAccent,
        selectionBackground: activeTheme.terminalSelection,
        black: activeTheme.black,
        red: activeTheme.red,
        green: activeTheme.green,
        yellow: activeTheme.yellow,
        blue: activeTheme.blue,
        magenta: activeTheme.magenta,
        cyan: activeTheme.cyan,
        white: activeTheme.white,
        brightBlack: activeTheme.brightBlack,
        brightRed: activeTheme.brightRed,
        brightGreen: activeTheme.brightGreen,
        brightYellow: activeTheme.brightYellow,
        brightBlue: activeTheme.brightBlue,
        brightMagenta: activeTheme.brightMagenta,
        brightCyan: activeTheme.brightCyan,
        brightWhite: activeTheme.brightWhite,
      }
    }
  }, [activeTheme])

  return { exited }
}
