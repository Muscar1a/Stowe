import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import { ThemeProvider } from './theme'

// Suppress Vite HMR ResizeObserver benign warning
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation()
  }
})

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)

