import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
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
import { RightRailProvider } from './contexts/RightRailContext'
import WsStatusBadge from './components/WsStatusBadge'
import RouteErrorBoundary from './components/RouteErrorBoundary'
// Critical path — eager-loaded to avoid first-paint flicker on entry routes.
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
// Secondary routes — code-split, fetched on demand.
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const InterestPage = lazy(() => import('./pages/InterestPage'))
const DomainSelectionPage = lazy(() => import('./pages/DomainSelectionPage'))
const NicheSelectionPage = lazy(() => import('./pages/NicheSelectionPage'))
const PlatformConnectionPage = lazy(
  () => import('./pages/PlatformConnectionPage'),
)
const DomainNicheSelectionPage = lazy(
  () => import('./pages/DomainNicheSelectionPage'),
)
const AllPlatformsPage = lazy(() => import('./pages/AllPlatformsPage'))
const ScoresPage = lazy(() => import('./pages/ScoresPage'))
const BadgeDetailPage = lazy(() => import('./pages/BadgeDetailPage'))
const PlatformDetailPage = lazy(() => import('./pages/PlatformDetailPage'))
const CirclesPage = lazy(() => import('./pages/CirclesPage'))
const ComposePage = lazy(() => import('./pages/ComposePage'))
const PerspectivePage = lazy(() => import('./pages/PerspectivePage'))
const StreaksPage = lazy(() => import('./pages/StreaksPage'))
const VotePage = lazy(() => import('./pages/VotePage'))
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'))
const BillingPage = lazy(() => import('./pages/BillingPage'))
import { useViewAs } from './hooks/useViewAs'
import './components/styles/design-system.css'
import './components/styles/layout.css'

function InterestsHydrationBoundary() {
  useInterestsHydration()
  return null
}

function RouteFallback() {
  return <div className="route-fallback" aria-busy="true" aria-live="polite" />
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
  // Standalone routes — no NavSidebar / RightSidebar wrapper.
  const isStandalone = location.pathname.startsWith('/settings')
  const cart = useCart()
  const sidebar = useSidebarState()
  const { collapsed: navCollapsed, toggle: toggleNavCollapsed } =
    useNavCollapse()
  // Routes that surface the ProfileDrawer on the right rail.
  const isProfilePage =
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/scores')
  // Routes that run full-width — no ProfileDrawer, no RightSidebar.
  const isFullWidthPage =
    location.pathname.startsWith('/circles') ||
    location.pathname.startsWith('/feed') ||
    location.pathname.startsWith('/compose') ||
    location.pathname.startsWith('/perspective') ||
    location.pathname.startsWith('/vote') ||
    location.pathname.startsWith('/streaks') ||
    location.pathname.startsWith('/leaderboard') ||
    location.pathname.startsWith('/settings')
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

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/settings/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
    )
  }

  return (
    <RightRailProvider>
      <div
        className={`relative min-h-screen bg-background${navCollapsed ? ' nav-collapsed' : ''}`}
      >
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
        {isFullWidthPage || !sidebar.isDesktop ? null : (
          <RightSidebar hidden={isProfilePage || cartOpen} />
        )}

        <CartDrawer
          items={cart.items}
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          onRemove={cart.removeItem}
          onClear={cart.clear}
          onSubmit={handleCartSubmit}
        />

        <ProfileDrawer
          isOpen={
            isProfilePage &&
            !cartOpen &&
            (sidebar.isDesktop || profileDrawerOpen)
          }
          onClose={() => setProfileDrawerOpen(false)}
        />

        <WeightModal
          isOpen={weightModalOpen}
          items={cart.items}
          onClose={() => setWeightModalOpen(false)}
          onSuccess={handleDepositSuccess}
        />

        <main
          className={[
            'main-content',
            isProfilePage && sidebar.isDesktop ? 'main-content--profile' : '',
            isFullWidthPage && sidebar.isDesktop
              ? 'main-content--no-right'
              : '',
            !sidebar.isDesktop ? 'main-content--no-sidebar' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <RouteErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/feed" element={<DashboardPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route
                  path="/profile/:address"
                  element={<PublicProfilePage />}
                />
                <Route path="/auth/callback" element={<OAuthCallbackPage />} />

                {/* Protected routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/interest/:topicId"
                  element={
                    <ProtectedRoute>
                      <InterestPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/interest/:topicId/platforms"
                  element={
                    <ProtectedRoute>
                      <PlatformConnectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/interest/:topicId/categories"
                  element={
                    <ProtectedRoute>
                      <DomainNicheSelectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/topics"
                  element={
                    <ProtectedRoute>
                      <DomainSelectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/categories"
                  element={
                    <ProtectedRoute>
                      <NicheSelectionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/platforms"
                  element={
                    <ProtectedRoute>
                      <AllPlatformsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scores"
                  element={
                    <ProtectedRoute>
                      <ScoresPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/scores/badges/:tier"
                  element={
                    <ProtectedRoute>
                      <BadgeDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/platform/:domain"
                  element={
                    <ProtectedRoute>
                      <PlatformDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/circles"
                  element={
                    <ProtectedRoute>
                      <CirclesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/circles/:id"
                  element={
                    <ProtectedRoute>
                      <CirclesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/compose"
                  element={
                    <ProtectedRoute>
                      <ComposePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perspective/:mode"
                  element={
                    <ProtectedRoute>
                      <PerspectivePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/streaks"
                  element={
                    <ProtectedRoute>
                      <StreaksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vote"
                  element={
                    <ProtectedRoute>
                      <VotePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/billing"
                  element={
                    <ProtectedRoute>
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>
    </RightRailProvider>
  )
}
