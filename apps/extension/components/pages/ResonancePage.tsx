import { Suspense, lazy, useState, useTransition } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))
const TrendingTab = lazy(() => import('./resonance-tabs/TrendingTab'))
const LeaderboardTab = lazy(() => import('./resonance-tabs/LeaderboardTab'))
const DebateTab = lazy(() => import('./resonance-tabs/DebateTab'))

type ResonanceTab = 'circle' | 'trending' | 'debate' | 'streak'

const ResonancePage = () => {
  const [activeTab, setActiveTab] = useState<ResonanceTab>('circle')
  const [, startTransition] = useTransition()

  return (
    <div className="page">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'circle' ? 'active' : ''}`}
          onClick={() => startTransition(() => setActiveTab('circle'))}
        >
          Circle
        </button>
        <button
          className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => startTransition(() => setActiveTab('trending'))}
        >
          Trending
        </button>
        <button
          className={`tab ${activeTab === 'debate' ? 'active' : ''}`}
          onClick={() => startTransition(() => setActiveTab('debate'))}
        >
          Vote
        </button>
        <button
          className={`tab ${activeTab === 'streak' ? 'active' : ''}`}
          onClick={() => startTransition(() => setActiveTab('streak'))}
        >
          Streak
        </button>
      </div>
      <div className="page-content">
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeTab === 'circle' && <CircleFeedTab />}
          {activeTab === 'trending' && <TrendingTab />}
          {activeTab === 'debate' && <DebateTab />}
          {activeTab === 'streak' && <LeaderboardTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
