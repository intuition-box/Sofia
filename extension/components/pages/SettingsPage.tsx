import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStatus } from '../tracking'
import WalletConnectionButton from '../THP_WalletConnectionButton'
import { Storage } from '@plasmohq/storage'
import { disconnectWallet, cleanupProvider } from '../../lib/metamask'
import { useStorage } from '@plasmohq/storage/hook'
import { elizaDataService } from '../../lib/indexedDB-methods'
import { useBookmarkImport } from '../../hooks/useBookmartImport'
import homeIcon from '../../assets/Icon=home.svg'
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

  // Bookmark import hook (provides persisted state across navigation)
  const { state: importState, startImport, resetImport, isImporting } = useBookmarkImport()
  const { progress, message, status } = importState

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

      alert('All storage cleared and wallet disconnected successfully!')
    } catch (error) {
      console.error('❌ Failed to clear storage:', error)
      alert('Failed to clear storage. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  // Starts the bookmark import process
  const handleImportBookmarks = async () => {
    if (!confirm('Import all your browser bookmarks to BookMarkAgent?')) return
    await startImport() // background handles progress updates via the hook
  }

  return (
    <div className="page settings-page">
      {/* Back button to home */}
      <button onClick={() => navigateTo('home-connected')} className="back-button">
        <img src={homeIcon} alt="Home" className="home-icon" />
      </button>

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

        {/* Bookmark Import Section */}
        <div className="settings-item">
          <span>Import Bookmarks</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            {/* Import button */}
            <button
              onClick={handleImportBookmarks}
              disabled={isImporting}
              className="import-bookmarks-button"
              style={{
                padding: '8px 16px',
                backgroundColor: isImporting ? '#6c757d' : '#e9850ad8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                opacity: isImporting ? 0.8 : 1,
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {isImporting ? 'Importing...' : 'Import to BookMarkAgent'}
            </button>

            {/* Progress bar */}
            {status !== 'idle' && (
              <div style={{ width: '100%', maxWidth: '300px' }}>
                {/* Status text and % */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#666'
                  }}
                >
                  <span>{message ?? (status === 'running' ? 'Import in progress...' : status)}</span>
                  <span>{Math.round(progress)}%</span>
                </div>

                {/* Visual progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: '#007bff',
                      transition: 'width 0.3s ease',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                {/* Reset button when finished */}
                {status === 'success' && (
                  <button style={{ marginTop: 8 }} onClick={resetImport}>
                    Reset
                  </button>
                )}
              </div>
            )}
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
    </div>
  )
}

export default SettingsPage
