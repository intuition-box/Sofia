import { useState, useEffect, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/ProfilePage.css'

// Lazy load tabs pour optimiser le chargement
const AccountTab = lazy(() => import('./profile-tabs/AccountTab'))
const CommunityTab = lazy(() => import('./profile-tabs/CommunityTab'))
const TrustCircleTab = lazy(() => import('./profile-tabs/FeedTab'))

const ProfilePage = () => {
  const { goBack, activeProfileTab, setActiveProfileTab } = useRouter()
  const [activeTab, setActiveTab] = useState<'account' | 'community' | 'trust-circle' | 'bookmarks' | 'signals'>(
    (activeProfileTab as 'account' | 'community' | 'trust-circle' | 'bookmarks' | 'signals') || 'account'
  )

  // Sync local tab state with router context
  const handleTabChange = (tab: 'account' | 'community' | 'trust-circle' | 'bookmarks' | 'signals') => {
    setActiveTab(tab)
    setActiveProfileTab(tab)
  }

  // Restore active tab when coming back from user profile
  useEffect(() => {
    if (activeProfileTab) {
      setActiveTab(activeProfileTab as 'account' | 'community' | 'trust-circle' | 'bookmarks' | 'signals')
    }
  }, [activeProfileTab])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <AccountTab />
          </Suspense>
        )
      case 'community':
        return (
          <Suspense fallback={<div className="loading-state">Loading...</div>}>
            <CommunityTab />
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
          onClick={() => handleTabChange('account')}
        >
          Account
        </button>
        <button
          className={`tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => handleTabChange('community')}
        >
          Community
        </button>
        <button
          className={`tab ${activeTab === 'trust-circle' ? 'active' : ''}`}
          onClick={() => handleTabChange('trust-circle')}
        >
          Activity
        </button>
      </div>

      <div className="page-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default ProfilePage