import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { COLOR_PRIMARIO, COLOR_SECUNDARIO, COLOR_AZUL, COLOR_FONDO } from './config'

const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(n)) return '0 0 0'
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const root = document.documentElement
root.style.setProperty('--color-primary-rgb', hexToRgb(COLOR_PRIMARIO))
root.style.setProperty('--color-secondary-rgb', hexToRgb(COLOR_SECUNDARIO))
root.style.setProperty('--color-light-rgb', hexToRgb('#F3F5FA'))
root.style.setProperty('--color-azul-rgb', hexToRgb(COLOR_AZUL))
root.style.setProperty('--color-papel-rgb', hexToRgb(COLOR_FONDO))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
