import { useState, Suspense, lazy } from 'react'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))
const ForYouTab = lazy(() => import('./resonance-tabs/ForYouTab'))

type ResonanceTab = 'For You' | 'Circle'

const ResonancePage = () => {
  const [activeTab, setActiveTab] = useState<ResonanceTab>('Circle')

  return (
    <div className="page">
      <div className="tabs">
        {(['Circle', 'For You'] as ResonanceTab[]).map(tab => (
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
          {activeTab === 'For You' && <ForYouTab />}
          {activeTab === 'Circle' && <CircleFeedTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
