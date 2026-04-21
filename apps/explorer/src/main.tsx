import { createRoot } from 'react-dom/client'
import { Providers } from './lib/providers'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <Providers>
    <App />
  </Providers>
)
