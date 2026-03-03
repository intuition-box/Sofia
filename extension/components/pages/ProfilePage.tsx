import { useState, useEffect, useTransition, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/ProfilePage.css'

// Lazy load tabs pour optimiser le chargement
const AccountTab = lazy(() => import('./profile-tabs/AccountTab'))
const CommunityTab = lazy(() => import('./profile-tabs/CommunityTab'))
const HistoryTab = lazy(() => import('./profile-tabs/HistoryTab'))

const ProfilePage = () => {
  const { goBack, activeProfileTab, setActiveProfileTab } = useRouter()
  const [activeTab, setActiveTab] = useState<'account' | 'community' | 'history' | 'bookmarks' | 'signals'>(
    (activeProfileTab as 'account' | 'community' | 'history' | 'bookmarks' | 'signals') || 'account'
  )

  const [expandedHistoryTriplet, setExpandedHistoryTriplet] = useState<{ tripletId: string } | null>(null)
  const [, startTransition] = useTransition()

  // Sync local tab state with router context
  const handleTabChange = (tab: 'account' | 'community' | 'history' | 'bookmarks' | 'signals') => {
    startTransition(() => {
      setActiveTab(tab)
      setActiveProfileTab(tab)
    })
  }

  // Restore active tab when coming back from user profile
  useEffect(() => {
    if (activeProfileTab) {
      setActiveTab(activeProfileTab as 'account' | 'community' | 'history' | 'bookmarks' | 'signals')
    }
  }, [activeProfileTab])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <Suspense fallback={<div className="loading-state"><SofiaLoader size={40} /></div>}>
            <AccountTab />
          </Suspense>
        )
      case 'community':
        return (
          <Suspense fallback={<div className="loading-state"><SofiaLoader size={40} /></div>}>
            <CommunityTab />
          </Suspense>
        )
      case 'history':
        return (
          <Suspense fallback={<div className="loading-state"><SofiaLoader size={40} /></div>}>
            <HistoryTab
              expandedTriplet={expandedHistoryTriplet}
              setExpandedTriplet={setExpandedHistoryTriplet}
            />
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
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleTabChange('history')}
        >
          History
        </button>
      </div>

      <div className="page-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default ProfilePage
