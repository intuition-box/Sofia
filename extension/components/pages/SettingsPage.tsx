import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import  TrackingStatus  from '../ui/TrackingStatus'
import WalletConnectionButton from '../ui/THP_WalletConnectionButton'
import { SessionWalletManager } from '../ui/SessionWalletManager'
import { Storage } from '@plasmohq/storage'
import { disconnectWallet, cleanupProvider } from '../../lib/services/metamask'
import { useStorage } from '@plasmohq/storage/hook'
import { elizaDataService } from '../../lib/database/indexedDB-methods'
import '../styles/Global.css'
import '../styles/SettingsPage.css'

const SettingsPage = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()

  // Local UI states
  const [isDataSharingEnabled, setIsDataSharingEnabled] = useState(false)
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

      alert('All storage cleared, OAuth disconnected, and wallet disconnected successfully!')
    } catch (error) {
      console.error('❌ Failed to clear storage:', error)
      alert('Failed to clear storage. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  // Simple direct imports 
  const handleImportBookmarks = async () => {
    if (!confirm('Import all your browser bookmarks?')) return
    chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' })
  }

  const handleImportHistory = async () => {
    if (!confirm('Analyze your browsing history?')) return
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' })
  }

  const handlePulseAnalysis = async () => {
    if (!confirm('Collect pulse data from all open tabs?')) return
    chrome.runtime.sendMessage({ type: 'START_PULSE_ANALYSIS' })
  }


  return (
    <div className="page settings-page">

      <h2 className="section-title">Settings</h2>

      {/* General Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">General</h3>
        <div className="settings-item">
          <span>Language</span>
          <select className="select">
            <option>English</option>
            {/* <option>Français</option> */}
          </select>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">Privacy</h3>

        {/* Toggle for tracking */}
        <div className="settings-item">
          <span>Data Tracking</span>
          <TrackingStatus isEnabled={isTrackingEnabled} onToggle={toggleTracking} />
        </div>

        {/* Toggle for sharing */}
        <div className="settings-item">
          <span>Data Sharing</span>
          <TrackingStatus
            isEnabled={isDataSharingEnabled}
            onToggle={() => setIsDataSharingEnabled(!isDataSharingEnabled)}
          />
        </div>

        {/* Import Section */}
        <div className="settings-item">
          <span>Import & Analyze</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <button
              onClick={handleImportBookmarks}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e9850ad8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                marginBottom: '8px'
              }}
            >
              Import Bookmarks
            </button>
            
            <button
              onClick={handleImportHistory}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Analyze History
            </button>

            <button
              onClick={handlePulseAnalysis}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              🫀 Pulse Analysis
            </button>

          </div>
        </div>

        {/* Clear all data section */}
        <div className="settings-item">
          <span>Clear All Data</span>
          <button
            onClick={handleClearStorage}
            disabled={isClearing}
            className="clear-storage-button"
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isClearing ? 'not-allowed' : 'pointer',
              opacity: isClearing ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isClearing ? 'Clearing...' : 'Clear Storage'}
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
