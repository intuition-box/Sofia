import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { useWalletFromStorage, disconnectWallet } from '../../hooks/useWalletFromStorage'
import SwitchButton from '../ui/SwitchButton'
import WalletConnectionButton from '../ui/THP_WalletConnectionButton'
import { Storage } from '@plasmohq/storage'
import { cleanupProvider } from '../../lib/services/metamask'
import { elizaDataService } from '../../lib/database/indexedDB-methods'
import { RecommendationService } from '../../lib/services/ai/RecommendationService'
import { GlobalResonanceService } from '../../lib/services/GlobalResonanceService'
import '../styles/Global.css'
import '../styles/SettingsPage.css'
import '../styles/Modal.css'

const SettingsPage = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()
  const { walletAddress: account, authenticated } = useWalletFromStorage()

  // Local UI states
  const [isClearing, setIsClearing] = useState(false)

  // Plasmo storage
  const storage = new Storage()


  // Clears all local storage (Plasmo + IndexedDB) and disconnects wallet
  const handleClearStorage = async () => {
    if (!confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) return
    setIsClearing(true)
    try {
      // Disconnect wallet if connected
      if (authenticated) {
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

      {/* Settings Section */}
      <div className="settings-section">

        {/* Connected Wallet */}
        {account && (
          <div className="settings-item">
            <span>Connected Wallet</span>
            <div className="wallet-address-display">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          </div>
        )}

        {/* Data Tracking */}
        <div className="settings-item">
          <div className="settings-item-content">
            <span>Data Tracking</span>
            <span className="settings-item-description">Enable or disable Sofia's data tracking</span>
          </div>
          <SwitchButton isEnabled={isTrackingEnabled} onToggle={toggleTracking} />
        </div>

        {/* Status */}
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

        {/* Wallet Connection */}
        <div className="settings-item">
          <span>Wallet Connection</span>
          <WalletConnectionButton />
        </div>

        {/* Clear All Data */}
        <div className="settings-item">
          <span>Clear All Data</span>
          <button
            onClick={handleClearStorage}
            disabled={isClearing}
            className="delete-button-3d noselect"
          >
            {isClearing ? 'Clearing...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
