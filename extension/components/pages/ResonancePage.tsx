import { Suspense, lazy, useState } from 'react'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))
const ForYouTab = lazy(() => import('./resonance-tabs/ForYouTab'))
const LeaderboardTab = lazy(() => import('./resonance-tabs/LeaderboardTab'))

type ResonanceTab = 'circle' | 'foryou' | 'streak'

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
          className={`tab ${activeTab === 'foryou' ? 'active' : ''}`}
          onClick={() => setActiveTab('foryou')}
        >
          For You
        </button>
        <button
          className={`tab ${activeTab === 'streak' ? 'active' : ''}`}
          onClick={() => setActiveTab('streak')}
        >
          Streak
        </button>
      </div>
      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeTab === 'circle' && <CircleFeedTab />}
          {activeTab === 'foryou' && <ForYouTab />}
          {activeTab === 'streak' && <LeaderboardTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
