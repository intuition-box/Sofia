import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks'
import { useWalletFromStorage, disconnectWallet } from '../../hooks'
import SwitchButton from '../ui/SwitchButton'
import WalletConnectionButton from '../ui/THP_WalletConnectionButton'
import { Storage } from '@plasmohq/storage'
import { cleanupProvider } from '../../lib/services/walletProvider'
import { tripletsDataService } from '../../lib/database'
import { RecommendationService } from '../../lib/services/ai/RecommendationService'
import '../styles/Global.css'
import '../styles/SettingsPage.css'
import { createHookLogger } from '../../lib/utils/logger'
import '../styles/Modal.css'
import packageJson from '~/package.json'

const logger = createHookLogger('SettingsPage')

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

      // Clear custom IndexedDB data (triplets, etc.)
      await tripletsDataService.clearAll()

      // Clear OAuth tokens, sync info, and platform profiles (old + per-wallet keys)
      const allLocalData: Record<string, any> = await chrome.storage.local.get()
      const keysToRemove = Object.keys(allLocalData).filter(key =>
        key.startsWith('oauth_token_') ||
        key.startsWith('sync_info_') ||
        key.startsWith('discord_profile') ||
        key.startsWith('completed_quests') ||
        key.startsWith('claimed_quests') ||
        key.startsWith('claimed_discovery_xp') ||
        key.startsWith('group_certification_xp') ||
        key.startsWith('spent_xp') ||
        key.startsWith('discovery_gold') ||
        key.startsWith('certification_gold') ||
        key.startsWith('spent_gold') ||
        key.startsWith('currency_migration_v1') ||
        key.startsWith('quest_progress_') ||
        key.startsWith('social_attestation') ||
        key === 'lastActiveWallet'
      )
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove)
      }

      // Clear recommendations cache (if user has account)
      if (account) {
        await RecommendationService.clearCache(account)
        logger.info('Recommendations cache cleared for account', account)
      }

      // Clear IndexedDB completely
      const databases = await indexedDB.databases()
      for (const db of databases) {
        if (db.name) {
          const deleteReq = indexedDB.deleteDatabase(db.name)
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => resolve(true)
            deleteReq.onerror = () => reject(deleteReq.error)
          })
          logger.info('Deleted IndexedDB database', db.name)
        }
      }

      alert('All storage cleared: Plasmo, IndexedDB, OAuth, Wallet, Recommendations, and Images!')
    } catch (error) {
      logger.error('Failed to clear storage', error)
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
            href="https://status.intuition.sh/"
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

        {/* Replay Tutorial */}
        <div className="settings-item">
          <span>Tutorial</span>
          <button
            onClick={() => navigateTo('onboarding-tutorial')}
            className="delete-button-3d noselect"
          >
            Tutorial
          </button>
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

      <p className="description-paragraph terms-text" style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', opacity: 0.6 }}>
        <a href="https://sofia.intuition.box/privacy" target="_blank" rel="noopener noreferrer"><strong>Privacy Policy</strong></a> · <a href="https://sofia.intuition.box/terms" target="_blank" rel="noopener noreferrer"><strong>Terms & Conditions</strong></a>
      </p>
      <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', opacity: 0.4 }}>
        v{packageJson.version}
      </p>
    </div>
  )
}

export default SettingsPage
