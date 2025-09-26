import { useState, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/ProfilePage.css'

// Lazy load tabs pour optimiser le chargement
const AccountTab = lazy(() => import('./profile-tabs/AccountTab'))
const TrustCircleTab = lazy(() => import('./profile-tabs/TrustCircleTab'))

const ProfilePage = () => {
  const { goBack } = useRouter()
  const [activeTab, setActiveTab] = useState<'account' | 'trust-circle' | 'bookmarks' | 'signals'>('account')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <AccountTab />
          </Suspense>
        )
      case 'trust-circle':
        return (
          <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <TrustCircleTab />
          </Suspense>
        )
      default:
        return <div className="empty-state">Coming soon...</div>
    }
  }

  return (
    <div className="page profile-page">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button
          className={`tab ${activeTab === 'trust-circle' ? 'active' : ''}`}
          onClick={() => setActiveTab('trust-circle')}
        >
          Trust Circle
        </button>
      </div>

      <div className="page-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default ProfilePage