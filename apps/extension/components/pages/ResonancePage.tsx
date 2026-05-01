import { Suspense, lazy, useState, useTransition } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CorePage.css'
import '../styles/CoreComponents.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./circles-tabs/CircleFeedTab'))
const TrendingTab = lazy(() => import('./circles-tabs/TrendingTab'))

type ResonanceTab = 'circle' | 'trending'

const ResonancePage = () => {
  const [activeTab, setActiveTab] = useState<ResonanceTab>('circle')
  const [, startTransition] = useTransition()

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
          {activeTab === 'circle' && <CircleFeedTab />}
          {activeTab === 'trending' && <TrendingTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
