import { Suspense, lazy, useState, useEffect, useTransition } from 'react'
import { useRouter } from '../layout/RouterProvider'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./circles-tabs/CircleFeedTab'))
const TrendingTab = lazy(() => import('./circles-tabs/TrendingTab'))
const CommunityTab = lazy(() => import('./circles-tabs/CommunityTab'))

type CirclesTab = 'circle' | 'trending' | 'community'

const CirclesPage = () => {
  const { activeTab: pendingTab } = useRouter()
  const [activeTab, setActiveTab] = useState<CirclesTab>('circle')
  const [, startTransition] = useTransition()

  // Sync from router when an external caller (e.g. CircleFeedTab's
  // circle-go-btn) pre-selects a tab via setActiveTab(...) before
  // navigating. Mirrors the pattern that ProfilePage used pre-refacto.
  useEffect(() => {
    if (
      pendingTab === 'circle' ||
      pendingTab === 'trending' ||
      pendingTab === 'community'
    ) {
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
        <button
          type="button"
          className={`pf-sort-btn ${activeTab === 'community' ? 'active' : ''}`}
          aria-pressed={activeTab === 'community'}
          onClick={() => startTransition(() => setActiveTab('community'))}
        >
          Community
        </button>
      </div>
      <div className="page-content">
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === 'circle' && <CircleFeedTab />}
          {activeTab === 'trending' && <TrendingTab />}
          {activeTab === 'community' && <CommunityTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CirclesPage
