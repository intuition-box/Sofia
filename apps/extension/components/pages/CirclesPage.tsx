import { Suspense, lazy, useState, useEffect, useTransition } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useWalletFromStorage } from '../../hooks'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'
import '../styles/CommunityHomeView.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./circles-tabs/CircleFeedTab'))
const TrendingTab = lazy(() => import('./circles-tabs/TrendingTab'))
const CommunityHomeView = lazy(() => import('./circles-tabs/CommunityHomeView'))
const TrustCirclePanel = lazy(() =>
  import('./circles-tabs/follow/TrustCirclePanel').then(m => ({
    default: m.TrustCirclePanel
  }))
)

type CirclesTab = 'circle' | 'trending'
type CircleLayer = 'home' | 'feed' | 'members'

const CirclesPage = () => {
  const { activeTab: pendingTab } = useRouter()
  const { walletAddress } = useWalletFromStorage()
  const [activeTab, setActiveTab] = useState<CirclesTab>('circle')
  const [circleLayer, setCircleLayer] = useState<CircleLayer>('home')
  const [, startTransition] = useTransition()

  // Sync from router when an external caller pre-selects a tab via
  // setActiveTab(...) before navigating. Mirrors the pattern that
  // ProfilePage used pre-refacto.
  useEffect(() => {
    if (pendingTab === 'circle' || pendingTab === 'trending') {
      setActiveTab(pendingTab as CirclesTab)
    }
  }, [pendingTab])

  return (
    <div className="page">
      <div className="pf-echoes-sort core-page-tabs" role="group" aria-label="Switch view">
        <button
          type="button"
          className={`pf-sort-btn ${activeTab === 'circle' ? 'active' : ''}`}
          aria-pressed={activeTab === 'circle'}
          onClick={() => startTransition(() => setActiveTab('circle'))}
        >
          Circle
        </button>
        <button
          type="button"
          className={`pf-sort-btn ${activeTab === 'trending' ? 'active' : ''}`}
          aria-pressed={activeTab === 'trending'}
          onClick={() => startTransition(() => setActiveTab('trending'))}
        >
          Trending
        </button>
      </div>
      <div className="page-content">
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === 'circle' && circleLayer === 'home' && (
            <CommunityHomeView onOpenFeed={() => setCircleLayer('feed')} />
          )}
          {activeTab === 'circle' && circleLayer === 'feed' && (
            <>
              <button
                type="button"
                className="circle-layer-back-btn"
                onClick={() => setCircleLayer('home')}
                aria-label="Back to community home"
              >
                ← Back
              </button>
              <CircleFeedTab onViewMembers={() => setCircleLayer('members')} />
            </>
          )}
          {activeTab === 'circle' && circleLayer === 'members' && (
            <>
              <button
                type="button"
                className="circle-layer-back-btn"
                onClick={() => setCircleLayer('feed')}
                aria-label="Back to feed"
              >
                ← Back to feed
              </button>
              <h3 className="circle-layer-title">Trust Circle Members</h3>
              <TrustCirclePanel
                walletAddress={walletAddress}
                onInviteMember={() => setCircleLayer('home')}
              />
            </>
          )}
          {activeTab === 'trending' && <TrendingTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CirclesPage
