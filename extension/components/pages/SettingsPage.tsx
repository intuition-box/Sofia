import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import SwitchButton from '../ui/SwitchButton'
import WalletConnectionButton from '../ui/THP_WalletConnectionButton'
import { SessionWalletManager } from '../ui/SessionWalletManager'
import { Storage } from '@plasmohq/storage'
import { disconnectWallet, cleanupProvider } from '../../lib/services/metamask'
import { useStorage } from '@plasmohq/storage/hook'
import { elizaDataService } from '../../lib/database/indexedDB-methods'
import { RecommendationService } from '../../lib/services/ai/RecommendationService'
import { GlobalResonanceService } from '../../lib/services/GlobalResonanceService'
import '../styles/Global.css'
import '../styles/SettingsPage.css'
import '../styles/Modal.css'

const SettingsPage = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()

  // Local UI states
  const [isClearing, setIsClearing] = useState(false)

  // Plasmo storage 
  const storage = new Storage()

  // Reactive Metamask account stored in Plasmo storage
  const [account, setAccount] = useStorage<string>('metamask-account')


  // Clears all local storage (Plasmo + IndexedDB) and disconnects wallet
  const handleClearStorage = async () => {
    if (!confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) return
    setIsClearing(true)
    try {
      // Disconnect MetaMask if connected
      if (account) {
        setAccount('')
        await disconnectWallet()
      }

      // Clean injected provider streams
      cleanupProvider()

      // Clear Plasmo storage
      await storage.clear()

      // Clear custom IndexedDB data (Eliza messages, triplets, etc.)
      await elizaDataService.clearAll()

      // Clear OAuth tokens and sync info
      await chrome.storage.local.remove([
        'oauth_token_youtube', 'oauth_token_spotify', 'oauth_token_twitch', 'oauth_token_twitter',
        'sync_info_youtube', 'sync_info_spotify', 'sync_info_twitch', 'sync_info_twitter'
      ])

      // Clear recommendations cache (if user has account)
      if (account) {
        await RecommendationService.clearCache(account)
        console.log('✅ Recommendations cache cleared for account:', account)
      }

      // Clear global resonance service state
      const globalService = GlobalResonanceService.getInstance()
      globalService.clearCache()
      console.log('✅ Global resonance service cache cleared')

      // Clear IndexedDB completely (recommendations + og:images)
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          const deleteReq = indexedDB.deleteDatabase(db.name)
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => resolve(true)
            deleteReq.onerror = () => reject(deleteReq.error)
          })
          console.log('✅ Deleted IndexedDB database:', db.name)
        }
      }

      alert('All storage cleared: Plasmo, IndexedDB, OAuth, Wallet, Recommendations, and Images!')
    } catch (error) {
      console.error('❌ Failed to clear storage:', error)
      alert('Failed to clear storage. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="page settings-page">

      <h2 className="section-title">Settings</h2>

      {/* Privacy Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">Privacy</h3>

        {/* Toggle for tracking */}
        <div className="settings-item">
          <span>Data Tracking</span>
          <SwitchButton isEnabled={isTrackingEnabled} onToggle={toggleTracking} />
        </div>

        {/* Clear all data section */}
        <div className="settings-item">
          <span>Clear All Data</span>
          <button
            onClick={handleClearStorage}
            disabled={isClearing}
            className="delete-button noselect"
          >
            <span className="text">{isClearing ? 'Clearing...' : 'Delete'}</span>
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"></path>
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Blockchain Integration Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">Blockchain Integration</h3>
        <div className="settings-item">
          <span>Wallet Connection</span>
          <WalletConnectionButton />
        </div>
        <div className="settings-item">
          <span>Status</span>
          <a
            href="https://stats.intuition.sh/"
            target="_blank"
            rel="noopener noreferrer"
            className="available-for-btn"
          >
            <div className="circle">
              <div className="dot"></div>
              <div className="outline"></div>
            </div>
            View Mainnet Status
          </a>
        </div>
      </div>

      {/* Session Wallet Section - Test Mode */}
      {account && (
        <div className="settings-section">
          <SessionWalletManager />
        </div>
      )}
    </div>
  )
}

export default SettingsPage
