import { useState, Suspense, lazy } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useStorage } from '@plasmohq/storage/hook'
import homeIcon from '../../assets/Icon=home.svg'
import '../styles/Global.css'
import '../styles/ProfilePage.css'

// Lazy loading des composants d'onglets
const BookmarkTab = lazy(() => import('./profile-tabs/BookmarkTab'))
const ExploreTab = lazy(() => import('./profile-tabs/ExploreTab'))
const AccountTab = lazy(() => import('./profile-tabs/AccountTab'))

const ProfilePage = () => {
  const { navigateTo } = useRouter()
  const [activeProfileTab, setActiveProfileTab] = useState<'Bookmarks' | 'Explore' | 'Account'>('Bookmarks')
  const [discordUser] = useStorage<any>("discord-user")
  const [xUser] = useStorage<any>("x-user")

  return (
    <div className="page profile-page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        <img src={homeIcon} alt="Home" className="home-icon" />
      </button>
      
      {(discordUser || xUser) && (
        <span className="verified-badge" title="Profil certifié">✓</span>
      )}
      
      <div className="tabs">
        {['Bookmarks', 'Explore', 'Account'].map(tab => (
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
          {activeProfileTab === 'Bookmarks' && <BookmarkTab />}
          {activeProfileTab === 'Explore' && <ExploreTab />}
          {activeProfileTab === 'Account' && <AccountTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default ProfilePage