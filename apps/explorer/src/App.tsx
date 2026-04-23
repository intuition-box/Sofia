import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { NavSidebar } from './components/NavSidebar'
import { RightSidebar } from './components/RightSidebar'
import CartDrawer from './components/CartDrawer'
import ProfileDrawer from './components/ProfileDrawer'
import WeightModal from './components/WeightModal'
import { useCart } from './hooks/useCart'
import { useNavCollapse } from './hooks/useNavCollapse'
import { useSidebarState } from './hooks/useSidebarState'
import { RealtimeSyncBoundary } from './hooks/useRealtimeSync'
import { useInterestsHydration } from './hooks/useInterestsHydration'
import WsStatusBadge from './components/WsStatusBadge'
import RouteErrorBoundary from './components/RouteErrorBoundary'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import InterestPage from './pages/InterestPage'
import DomainSelectionPage from './pages/DomainSelectionPage'
import NicheSelectionPage from './pages/NicheSelectionPage'
import PlatformConnectionPage from './pages/PlatformConnectionPage'
import DomainNicheSelectionPage from './pages/DomainNicheSelectionPage'
import AllPlatformsPage from './pages/AllPlatformsPage'
import ScoresPage from './pages/ScoresPage'
import CirclesPage from './pages/CirclesPage'
import StreaksPage from './pages/StreaksPage'
import VotePage from './pages/VotePage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import PublicProfilePage from './pages/PublicProfilePage'
import { useViewAs } from './hooks/useViewAs'
import './components/styles/design-system.css'
import './components/styles/layout.css'

function InterestsHydrationBoundary() {
  useInterestsHydration()
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy()
  const { isViewingAs } = useViewAs()
  if (!ready) return null
  if (!authenticated && !isViewingAs) return <Navigate to="/feed" replace />
  return <>{children}</>
}

export default function App() {
  const location = useLocation()
  const isCallback = location.pathname === '/auth/callback'
  const isLanding = location.pathname === '/'
  const cart = useCart()
  const sidebar = useSidebarState()
  const { collapsed: navCollapsed, toggle: toggleNavCollapsed } = useNavCollapse()
  // Routes that surface the ProfileDrawer on the right rail.
  const isProfilePage =
    location.pathname.startsWith('/profile') || location.pathname === '/scores'
  const [cartOpen, setCartOpen] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [weightModalOpen, setWeightModalOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setProfileDrawerOpen(false)
  }, [location.pathname])

  // Auto-close cart when it becomes empty
  useEffect(() => {
    if (cartOpen && cart.count === 0) setCartOpen(false)
  }, [cartOpen, cart.count])

  const handleCartSubmit = useCallback(() => {
    setCartOpen(false)
    setWeightModalOpen(true)
  }, [])

  const handleDepositSuccess = useCallback(() => {
    cart.clear()
  }, [cart])

  if (isCallback) {
    return <OAuthCallbackPage />
  }

  if (isLanding) {
    return <LandingPage />
  }

  return (
    <div className={`min-h-screen bg-background${navCollapsed ? ' nav-collapsed' : ''}`}>
      {/* Opens the WS connection and subscribes to the user's positions.
          Invisible — pushes deltas into the React Query cache. */}
      <RealtimeSyncBoundary />
      {/* Hydrates topics/categories from on-chain positions — union-merges into localStorage. */}
      <InterestsHydrationBoundary />
      <WsStatusBadge />
      <NavSidebar
        onCartClick={() => setCartOpen((o) => !o)}
        collapsed={navCollapsed}
        onToggleCollapse={toggleNavCollapsed}
      />
      <RightSidebar hidden={isProfilePage || cartOpen || !sidebar.isDesktop} />

      <CartDrawer
        items={cart.items}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onRemove={cart.removeItem}
        onClear={cart.clear}
        onSubmit={handleCartSubmit}
      />

      <ProfileDrawer
        isOpen={isProfilePage && !cartOpen && (sidebar.isDesktop || profileDrawerOpen)}
        onClose={() => setProfileDrawerOpen(false)}
      />

      <WeightModal
        isOpen={weightModalOpen}
        items={cart.items}
        onClose={() => setWeightModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />

      <main className={`main-content${isProfilePage && sidebar.isDesktop ? ' main-content--profile' : ''}${!sidebar.isDesktop ? ' main-content--no-sidebar' : ''}`}>
        <RouteErrorBoundary key={location.pathname}>
        <Routes>
          {/* Public routes */}
          <Route path="/feed" element={<DashboardPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile/:address" element={<PublicProfilePage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* Protected routes */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/profile/interest/:topicId" element={<ProtectedRoute><InterestPage /></ProtectedRoute>} />
          <Route path="/profile/interest/:topicId/platforms" element={<ProtectedRoute><PlatformConnectionPage /></ProtectedRoute>} />
          <Route path="/profile/interest/:topicId/categories" element={<ProtectedRoute><DomainNicheSelectionPage /></ProtectedRoute>} />
          <Route path="/profile/topics" element={<ProtectedRoute><DomainSelectionPage /></ProtectedRoute>} />
          <Route path="/profile/categories" element={<ProtectedRoute><NicheSelectionPage /></ProtectedRoute>} />
          <Route path="/platforms" element={<ProtectedRoute><AllPlatformsPage /></ProtectedRoute>} />
          <Route path="/scores" element={<ProtectedRoute><ScoresPage /></ProtectedRoute>} />
          <Route path="/circles" element={<ProtectedRoute><CirclesPage /></ProtectedRoute>} />
          <Route path="/circles/:id" element={<ProtectedRoute><CirclesPage /></ProtectedRoute>} />
          <Route path="/streaks" element={<ProtectedRoute><StreaksPage /></ProtectedRoute>} />
          <Route path="/vote" element={<ProtectedRoute><VotePage /></ProtectedRoute>} />
        </Routes>
        </RouteErrorBoundary>
      </main>
    </div>
  )
}
