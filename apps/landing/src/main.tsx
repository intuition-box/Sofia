import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './lib/services/WalletProvider'
import { SmoothScroll } from './lib/animation/SmoothScroll'
import './styles/global.css'
import App from './App'
import { AuthPage } from './auth/AuthPage'
import { AuthLogout } from './auth/AuthLogout'
import { OAuthInitiate } from './auth/OAuthInitiate'
import { OAuthCallback } from './auth/OAuthCallback'
import { OAUTH_PLATFORMS } from './auth/oauthConfig'

/* Disable browser scroll restoration so refreshes always land at the
   top of the page. The scene stack owns its own initial-state logic
   and a restored scrollY mid-stack would land the user on the wrong
   scene. */
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider>
      <SmoothScroll>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/logout" element={<AuthLogout />} />
            {OAUTH_PLATFORMS.flatMap((p) => [
              <Route
                key={p}
                path={`/auth/${p}`}
                element={<OAuthInitiate platform={p} />}
              />,
              <Route
                key={`${p}/callback`}
                path={`/auth/${p}/callback`}
                element={<OAuthCallback platform={p} />}
              />,
            ])}
          </Routes>
        </BrowserRouter>
      </SmoothScroll>
    </WalletProvider>
  </StrictMode>,
)
