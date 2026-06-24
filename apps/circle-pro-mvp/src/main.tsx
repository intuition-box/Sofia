import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

// React Grab — dev-only element selector. Hover any element and press ⌘C /
// Ctrl+C to copy its source context (file · component · line). Guarded by
// import.meta.env.DEV so it's tree-shaken out of the production build.
if (import.meta.env.DEV) {
  import('react-grab')
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
