import { createContext, useContext, ReactNode } from 'react'

export interface Theme {
  id: string
  name: string
  terminalBg: string
  terminalFg: string
  terminalCursor: string
}

const DRACULA: Theme = {
  id: 'dracula',
  name: 'Dracula',
  terminalBg: '#282a36',
  terminalFg: '#f8f8f2',
  terminalCursor: '#bd93f9',
}

interface ThemeContextType {
  activeTheme: Theme
}

const ThemeContext = createContext<ThemeContextType>({ activeTheme: DRACULA })

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ activeTheme: DRACULA }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
