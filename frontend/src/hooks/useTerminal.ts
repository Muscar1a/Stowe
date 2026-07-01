import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import { WriteToTerminal, ResizeTerminal, CloseTerminal } from '../../wailsjs/go/main/App'

interface PTYData { id: string; data: string }
interface PTYExit { id: string; code: number }

export function useTerminal(containerRef: React.RefObject<HTMLDivElement | null>, ptyID: string | null) {
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const [exited, setExited] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !ptyID) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Cascadia Code, Consolas, monospace',
      theme: {
        background: '#0d1117',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
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
      CloseTerminal(ptyID)
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [ptyID])

  return { exited }
}
