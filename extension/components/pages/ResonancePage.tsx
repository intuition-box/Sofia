import { useState, Suspense, lazy } from 'react'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'
import '../styles/CorePage.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))
const TrendingTab = lazy(() => import('./resonance-tabs/TrendingTab'))

type ResonanceTab = 'Circle' | 'Trending'

const ResonancePage = () => {
  const [activeTab, setActiveTab] = useState<ResonanceTab>('Circle')

  return (
    <div className="page">
      <div className="tabs">
        {(['Circle', 'Trending'] as ResonanceTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeTab === 'Circle' && <CircleFeedTab />}
          {activeTab === 'Trending' && <TrendingTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
