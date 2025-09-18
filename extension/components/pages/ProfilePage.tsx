import { useState, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useStorage } from '@plasmohq/storage/hook'
import '../styles/Global.css'
import '../styles/ProfilePage.css'

// Lazy loading des composants d'onglets
const AccountTab = lazy(() => import('./profile-tabs/AccountTab'))

const ProfilePage = () => {
  const { navigateTo } = useRouter()
  const [activeProfileTab, setActiveProfileTab] = useState<'Account'>('Account')
  const [discordUser] = useStorage<any>("discord-user")
  const [xUser] = useStorage<any>("x-user")

  return (
    <div className="page profile-page">
      
      {(discordUser || xUser) && (
        <span className="verified-badge" title="Verified Profile">✓</span>
      )}
      
      <div className="tabs">
        {['Account'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveProfileTab(tab as any)}
            className={`tab ${activeProfileTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeProfileTab === 'Account' && <AccountTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ProfilePage