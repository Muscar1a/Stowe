import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Theme {
  id: string
  name: string
  // terminal configuration for xterm.js
  terminalBg: string
  terminalFg: string
  terminalCursor: string
}

export const THEMES: Theme[] = [
  {
    id: 'stowe-dark',
    name: 'Stowe Dark',
    terminalBg: '#0d1117',
    terminalFg: '#e6edf3',
    terminalCursor: '#58a6ff'
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    terminalBg: '#11111b',
    terminalFg: '#cdd6f4',
    terminalCursor: '#f5e0dc'
  },
  {
    id: 'dracula',
    name: 'Dracula',
    terminalBg: '#282a36',
    terminalFg: '#f8f8f2',
    terminalCursor: '#bd93f9'
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    terminalBg: '#1a1b26',
    terminalFg: '#a9b1d6',
    terminalCursor: '#c0caf5'
  },
  {
    id: 'nord',
    name: 'Nord',
    terminalBg: '#2e3440',
    terminalFg: '#eceff4',
    terminalCursor: '#88c0d0'
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    terminalBg: '#0d1117',
    terminalFg: '#c9d1d9',
    terminalCursor: '#58a6ff'
  }
]

interface ThemeContextType {
  activeTheme: Theme
  setTheme: (themeId: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem('stowe-theme') || 'stowe-dark'
  })

  const activeTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0]

  useEffect(() => {
    localStorage.setItem('stowe-theme', activeThemeId)
    // Apply data-theme attribute to root document
    document.documentElement.setAttribute('data-theme', activeThemeId)
  }, [activeThemeId])

  const setTheme = (themeId: string) => {
    if (THEMES.some(t => t.id === themeId)) {
      setActiveThemeId(themeId)
    }
  }

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
