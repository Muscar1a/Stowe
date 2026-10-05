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

export const DEFAULT_THEME: Theme = {
  id: 'stowe-light',
  name: 'Stowe Light',
  terminalBg: '#1F1E1D',
  terminalFg: '#e4e4ed',
  terminalCursor: '#D97757',
  terminalCursorAccent: '#1F1E1D',
  terminalSelection: 'rgba(55, 60, 90, 0.45)',
  black: '#1a1a1f', red: '#e06c75', green: '#7ec780', yellow: '#c49a35',
  blue: '#6ba8e0', magenta: '#c678dd', cyan: '#56b6c2', white: '#b8b8c6',
  brightBlack: '#3a3a48', brightRed: '#f08090', brightGreen: '#98e09a',
  brightYellow: '#d4b04a', brightBlue: '#80c0f0', brightMagenta: '#d688ed',
  brightCyan: '#76c6d2', brightWhite: '#e4e4ed',
}

interface ThemeContextType {
  activeTheme: Theme
}

const ThemeContext = createContext<ThemeContextType>({ activeTheme: DEFAULT_THEME })

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ activeTheme: DEFAULT_THEME }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
