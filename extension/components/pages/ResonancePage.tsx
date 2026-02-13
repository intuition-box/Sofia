import { Suspense, lazy } from 'react'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/CoreComponents.css'

// Lazy load tab components (required by Parcel bundler)
const CircleFeedTab = lazy(() => import('./resonance-tabs/CircleFeedTab'))
// const ForYouTab = lazy(() => import('./resonance-tabs/ForYouTab'))

const ResonancePage = () => {
  return (
    <div className="page">
      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          <CircleFeedTab />
        </Suspense>
      </div>
    </div>
  )
}

export default ResonancePage
