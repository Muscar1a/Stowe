import { createContext, useContext, ReactNode } from 'react'

export interface Theme {
  id: string
  name: string
  terminalBg: string
  terminalFg: string
  terminalCursor: string
  terminalCursorAccent?: string
  terminalSelection?: string
  black?: string
  red?: string
  green?: string
  yellow?: string
  blue?: string
  magenta?: string
  cyan?: string
  white?: string
  brightBlack?: string
  brightRed?: string
  brightGreen?: string
  brightYellow?: string
  brightBlue?: string
  brightMagenta?: string
  brightCyan?: string
  brightWhite?: string
}

export const TOKYO_NIGHT: Theme = {
  id: 'tokyo-night',
  name: 'Tokyo Night Storm',
  terminalBg: '#1a1b26',
  terminalFg: '#c0caf5',
  terminalCursor: '#7aa2f7',
  terminalCursorAccent: '#15161e',
  terminalSelection: 'rgba(51, 70, 122, 0.5)',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#ff899e',
  brightGreen: '#b9f27c',
  brightYellow: '#ffc777',
  brightBlue: '#89b4fa',
  brightMagenta: '#c099ff',
  brightCyan: '#89ddff',
  brightWhite: '#c0caf5',
}

interface ThemeContextType {
  activeTheme: Theme
}

const ThemeContext = createContext<ThemeContextType>({
  activeTheme: TOKYO_NIGHT,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ activeTheme: TOKYO_NIGHT }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
