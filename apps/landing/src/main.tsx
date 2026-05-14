import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './lib/web3/PrivyContext'
import { SmoothScroll } from './lib/animation/SmoothScroll'
import './styles/global.css'
import App from './App'
import { AuthPage } from './pages/auth/AuthPage'
import { AuthLogout } from './pages/auth/AuthLogout'
import { OAuthInitiate } from './pages/auth/OAuthInitiate'
import { OAuthCallback } from './pages/auth/OAuthCallback'

/* Disable browser scroll restoration so refreshes always land at the
   top of the page. The deck owns its own initial-state logic and a
   restored scrollY mid-deck would land the user on the wrong slide. */
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
            <Route
              path="/auth/discord"
              element={<OAuthInitiate platform="discord" />}
            />
            <Route
              path="/auth/discord/callback"
              element={<OAuthCallback platform="discord" />}
            />
            <Route
              path="/auth/spotify"
              element={<OAuthInitiate platform="spotify" />}
            />
            <Route
              path="/auth/spotify/callback"
              element={<OAuthCallback platform="spotify" />}
            />
            <Route
              path="/auth/twitch"
              element={<OAuthInitiate platform="twitch" />}
            />
            <Route
              path="/auth/twitch/callback"
              element={<OAuthCallback platform="twitch" />}
            />
            <Route
              path="/auth/twitter"
              element={<OAuthInitiate platform="twitter" />}
            />
            <Route
              path="/auth/twitter/callback"
              element={<OAuthCallback platform="twitter" />}
            />
            <Route
              path="/auth/youtube"
              element={<OAuthInitiate platform="youtube" />}
            />
            <Route
              path="/auth/youtube/callback"
              element={<OAuthCallback platform="youtube" />}
            />
          </Routes>
        </BrowserRouter>
      </SmoothScroll>
    </WalletProvider>
  </StrictMode>,
)
