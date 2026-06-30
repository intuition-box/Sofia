import { createRoot } from 'react-dom/client'
import { Providers } from './lib/providers'
import App from './App'
import './index.css'

// React Grab — dev-only. Lets you select any UI element and copy its source
// context (component stack + file locations) for a coding agent. Stripped
// from production builds since the import is guarded by import.meta.env.DEV.
if (import.meta.env.DEV) {
  import('react-grab')
}

createRoot(document.getElementById('root')!).render(
  <Providers>
    <App />
  </Providers>,
)
