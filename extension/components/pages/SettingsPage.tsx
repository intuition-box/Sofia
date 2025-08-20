import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStatus } from '../tracking'
import WalletConnectionButton from '../THP_WalletConnectionButton'
import { Storage } from '@plasmohq/storage'
import { disconnectWallet, cleanupProvider } from '../../lib/metamask'
import { useStorage } from '@plasmohq/storage/hook'
import homeIcon from '../../assets/Icon=home.svg'
import '../styles/Global.css'
import '../styles/SettingsPage.css'

const SettingsPage = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()
  const [isDataSharingEnabled, setIsDataSharingEnabled] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isImportingBookmarks, setIsImportingBookmarks] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  
  const storage = new Storage()
  const [account, setAccount] = useStorage<string>("metamask-account")


  const handleClearStorage = async () => {
    if (!confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      return
    }
    
    setIsClearing(true)
    try {
      // Disconnect MetaMask wallet first
      if (account) {
        setAccount("")
        await disconnectWallet()
        console.log("🔌 MetaMask wallet disconnected")
      }
      
      // Cleanup provider streams
      cleanupProvider()
      console.log("🧹 MetaMask provider streams cleaned")
      
      // Clear all storage
      await storage.clear()
      console.log("🧹 Plasmo Storage cleared successfully")
      alert('Storage cleared and wallet disconnected successfully!')
    } catch (error) {
      console.error('❌ Failed to clear storage:', error)
      alert('Failed to clear storage. Please try again.')
    } finally {
      setIsClearing(false)
    }
  }

  const handleImportBookmarks = async () => {
    console.log('📚 [SettingsPage] Import bookmarks button clicked')
    
    if (!confirm('Import all your browser bookmarks to BookMarkAgent?')) {
      console.log('📚 [SettingsPage] User cancelled import')
      return
    }
    
    console.log('📚 [SettingsPage] User confirmed import, starting process...')
    setIsImportingBookmarks(true)
    setImportProgress(0)
    setImportStatus('Initializing import...')
    
    // Set up progress listener
    const progressListener = (message: any) => {
      if (message.type === 'BOOKMARK_IMPORT_PROGRESS') {
        console.log('📊 [SettingsPage] Progress update:', message)
        setImportProgress(message.progress)
        setImportStatus(message.status)
      }
    }
    
    chrome.runtime.onMessage.addListener(progressListener)
    
    try {
      console.log('📚 [SettingsPage] Sending GET_BOOKMARKS message to background...')
      const startTime = Date.now()
      setImportStatus('Getting bookmarks...')
      
      const response = await chrome.runtime.sendMessage({ type: "GET_BOOKMARKS" })
      
      const endTime = Date.now()
      console.log(`📚 [SettingsPage] Received response after ${endTime - startTime}ms:`, response)
      
      if (response.success) {
        console.log(`📚 [SettingsPage] Import process completed:`, response)
        setImportProgress(100)
        
        if (response.successfulBatches === response.totalBatches) {
          // Tous les batches ont réussi
          setImportStatus(`Import completed successfully! ${response.count} bookmarks processed`)
          setTimeout(() => {
            alert(`Successfully imported ${response.count} bookmarks to BookMarkAgent! (${response.successfulBatches}/${response.totalBatches} batches processed)`)
          }, 500)
        } else {
          // Certains batches ont échoué
          setImportStatus(`Import completed with errors: ${response.successfulBatches}/${response.totalBatches} batches successful`)
          setTimeout(() => {
            alert(`Import completed with some errors:\n- Successful batches: ${response.successfulBatches}/${response.totalBatches}\n- Bookmarks processed: ${response.count}\n- Some batches may have timed out or failed due to GaiaNet issues`)
          }, 500)
        }
      } else {
        console.error('📚 [SettingsPage] Import failed:', response.error)
        setImportStatus(`Import failed: ${response.error}`)
        alert(`Failed to import bookmarks: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ [SettingsPage] Exception during import:', error)
      setImportStatus('Import failed due to an error')
      alert('Failed to import bookmarks. Please try again.')
    } finally {
      chrome.runtime.onMessage.removeListener(progressListener)
      setTimeout(() => {
        setIsImportingBookmarks(false)
        setImportProgress(0)
        setImportStatus('')
      }, 2000)
    }
  }

  return (
    <div className="page settings-page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
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
        
        <div className="settings-item">
          <span>Data Tracking</span>
          <TrackingStatus 
            isEnabled={isTrackingEnabled}
            onToggle={toggleTracking}
          />
        </div>
        
        <div className="settings-item">
          <span>Data Sharing</span>
          <TrackingStatus 
            isEnabled={isDataSharingEnabled}
            onToggle={() => setIsDataSharingEnabled(!isDataSharingEnabled)}
          />
        </div>
        
        <div className="settings-item">
          <span>Import Bookmarks</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <button 
              onClick={handleImportBookmarks}
              disabled={isImportingBookmarks}
              className="import-bookmarks-button"
              style={{
                padding: '8px 16px',
                backgroundColor: isImportingBookmarks ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isImportingBookmarks ? 'not-allowed' : 'pointer',
                opacity: isImportingBookmarks ? 0.8 : 1,
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              {isImportingBookmarks ? 'Importing...' : 'Import to BookMarkAgent'}
            </button>
            
            {isImportingBookmarks && (
              <div style={{ width: '100%', maxWidth: '300px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span>{importStatus}</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${importProgress}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
        
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