import { Suspense, lazy, useState } from 'react'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'
import '../styles/CorePage.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))
const FeedTab = lazy(() => import('./resonance-tabs/FeedTab'))
const TrendingTab = lazy(() => import('./resonance-tabs/TrendingTab'))
const LeaderboardTab = lazy(() => import('./resonance-tabs/LeaderboardTab'))

type ResonanceTab = 'circle' | 'activity' | 'trending' | 'streak'

const ResonancePage = () => {
  const [activeTab, setActiveTab] = useState<ResonanceTab>('circle')

  return (
    <div className="page">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'circle' ? 'active' : ''}`}
          onClick={() => setActiveTab('circle')}
        >
          Circle
        </button>
        <button
          className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          Trending
        </button>
        <button
          className={`tab ${activeTab === 'streak' ? 'active' : ''}`}
          onClick={() => setActiveTab('streak')}
        >
          Streak
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>
      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeTab === 'activity' && <FeedTab />}
          {activeTab === 'circle' && <CircleFeedTab />}
          {activeTab === 'trending' && <TrendingTab />}
          {activeTab === 'streak' && <LeaderboardTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
