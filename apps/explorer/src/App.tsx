import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import {
  Routes,
  Route,
  useLocation,
  useParams,
  Navigate,
} from 'react-router-dom'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { NavSidebar } from './components/NavSidebar'
import { RightSidebar } from './components/RightSidebar'
import { MobileHeader } from './components/MobileHeader'
import { BottomNav } from './components/BottomNav'
import CartDrawer from './components/CartDrawer'
import ProfileDrawer from './components/ProfileDrawer'
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
const ContextManagerPage = lazy(() => import('./pages/ContextManagerPage'))
import { useViewAs } from './hooks/useViewAs'
import './components/styles/design-system.css'
import './components/styles/layout.css'
import './components/styles/mobile-shell.css'

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

/** Maps the legacy `/circles/group/:id` URL onto `/circles/:id`. The
 *  unified CirclesPage handles both trust and on-chain group ids. */
function LegacyGroupRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/circles/${id ?? ''}`} replace />
}

export default function App() {
  const location = useLocation()
  const isCallback = location.pathname === '/auth/callback'
  const isLanding = location.pathname === '/'
  const cart = useCart()
  const sidebar = useSidebarState()
  const { ready: privyReady, authenticated } = usePrivy()
  const { login } = useLogin()
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
    location.pathname.startsWith('/leaderboard')
  const cartOpen = cart.isOpen
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    setProfileDrawerOpen(false)
    /* Close mobile drawers on navigation — tapping a nav link should
       always feel like it "did something" (page changed AND drawer
       dismissed), not strand the user looking at the drawer over the
       new page. */
    sidebar.closeLeft()
    sidebar.closeRight()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  /* ESC closes whichever drawer is open on mobile. Only registers when
     a drawer is actually open so we don't fight other ESC handlers
     (modals, autocompletes) at rest. */
  useEffect(() => {
    if (!sidebar.leftOpen && !sidebar.rightOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      sidebar.closeLeft()
      sidebar.closeRight()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebar])

  /* Lock body scroll while a drawer is open so the page underneath
     doesn't move when the user scrolls inside the drawer. Restores
     the previous overflow on cleanup. */
  useEffect(() => {
    const anyOpen = sidebar.leftOpen || sidebar.rightOpen
    if (!anyOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [sidebar.leftOpen, sidebar.rightOpen])

  const handleAuthRequired = useCallback(() => {
    if (!privyReady) return
    login()
  }, [privyReady, login])

  const closeAllDrawers = useCallback(() => {
    sidebar.closeLeft()
    sidebar.closeRight()
  }, [sidebar])

  const handleDepositSuccess = useCallback(() => {
    cart.clear()
  }, [cart])

  if (isCallback) {
    return <OAuthCallbackPage />
  }

  if (isLanding) {
    return <LandingPage />
  }

  /* On tablet/mobile, the desktop nav-collapse preference doesn't apply —
     the shell forces 68px (tablet + mobile drawer) via mobile-shell.css.
     Pass collapsed=true to NavSidebar at those sizes so its labels stay
     hidden and the rail reads as icon-only — matches the visual width
     we're constraining the drawer to. */
  const effectiveNavCollapsed = sidebar.isDesktop ? navCollapsed : true

  /* Desktop / large-tablet: render the right rail as a real grid sibling.
     Below the laptop breakpoint mobile-shell.css turns it into a drawer
     so we still want the markup mounted — the rail toggle in the mobile
     header opens it via `right-open`. Pages tagged full-width or the
     profile/cart-open states still suppress the rail entirely. */
  const showRightSidebar = !isFullWidthPage && !isProfilePage && !cartOpen

  const cartItemCount = cart.items.length

  return (
    <RightRailProvider>
      <div
        className={[
          'relative min-h-screen bg-background',
          /* Drive the .nav-collapsed root class from the EFFECTIVE state,
             not just the user preference: tablet + mobile drawer also need
             the DS' `.nav-collapsed .nav-sidebar` selectors to fire (those
             are the rules that actually hide labels, hide circle names,
             collapse the toolbar, etc.). Without this the nav stays at
             68px in width but its inner content overflows because labels
             still render at expanded sizing. */
          effectiveNavCollapsed ? 'nav-collapsed' : '',
          sidebar.leftOpen ? 'nav-open' : '',
          sidebar.rightOpen ? 'right-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Opens the WS connection and subscribes to the user's positions.
          Invisible — pushes deltas into the React Query cache. */}
        <RealtimeSyncBoundary />
        {/* Hydrates topics/categories from on-chain positions — union-merges into localStorage. */}
        <InterestsHydrationBoundary />
        <WsStatusBadge />

        {/* Mobile chrome — fixed top header + bottom nav. Both are
            hidden via CSS on desktop; rendering them unconditionally
            keeps the markup stable across breakpoints so route changes
            on viewport resize don't blow away component state. */}
        <MobileHeader
          onMenuClick={sidebar.toggleLeft}
          onRightRailClick={showRightSidebar ? sidebar.toggleRight : undefined}
          onCartClick={cart.toggle}
          cartCount={cartItemCount}
          hideRightRailButton={!showRightSidebar}
        />
        <BottomNav
          authenticated={authenticated}
          onAuthRequired={handleAuthRequired}
        />

        {/* Drawer overlay — dims the page when either side drawer is
            open and dismisses on click. CSS-hidden by default, shown
            via .nav-open / .right-open on the wrapper. */}
        <div
          className="app-drawer-overlay"
          onClick={closeAllDrawers}
          aria-hidden="true"
        />

        <NavSidebar
          onCartClick={cart.toggle}
          collapsed={effectiveNavCollapsed}
          onToggleCollapse={toggleNavCollapsed}
        />
        {showRightSidebar && (
          <RightSidebar hidden={isProfilePage || cartOpen} />
        )}

        <CartDrawer
          items={cart.items}
          isOpen={cartOpen}
          onClose={cart.close}
          onRemove={cart.removeItem}
          onSuccess={handleDepositSuccess}
        />

        <ProfileDrawer
          isOpen={
            isProfilePage &&
            !cartOpen &&
            (sidebar.isDesktop || profileDrawerOpen)
          }
          onClose={() => setProfileDrawerOpen(false)}
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
                  path="/profile/context-manager"
                  element={
                    <ProtectedRoute>
                      <ContextManagerPage />
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
                {/* Circles routes are PUBLIC — a visitor can browse the
                    on-chain groups and their members without connecting.
                    Join + create actions surface a Connect CTA via the
                    locked overlay when no wallet is linked. */}
                <Route path="/circles" element={<CirclesPage />} />
                {/* Legacy redirect — older share links pointed to
                    `/circles/group/:termId`. The unified detail page
                    lives at `/circles/:id` now. */}
                <Route
                  path="/circles/group/:id"
                  element={<LegacyGroupRedirect />}
                />
                <Route path="/circles/:id" element={<CirclesPage />} />
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
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>
    </RightRailProvider>
  )
}
