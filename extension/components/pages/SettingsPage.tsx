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
    
    try {
      console.log('📚 [SettingsPage] Sending GET_BOOKMARKS message to background...')
      const startTime = Date.now()
      
      const response = await chrome.runtime.sendMessage({ type: "GET_BOOKMARKS" })
      
      const endTime = Date.now()
      console.log(`📚 [SettingsPage] Received response after ${endTime - startTime}ms:`, response)
      
      if (response.success) {
        console.log(`📚 [SettingsPage] Success! Imported ${response.count} bookmarks`)
        alert(`Successfully imported ${response.count} bookmarks to BookMarkAgent!`)
      } else {
        console.error('📚 [SettingsPage] Import failed:', response.error)
        alert(`Failed to import bookmarks: ${response.error}`)
      }
    } catch (error) {
      console.error('❌ [SettingsPage] Exception during import:', error)
      alert('Failed to import bookmarks. Please try again.')
    } finally {
      setIsImportingBookmarks(false)
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
          <button 
            onClick={handleImportBookmarks}
            disabled={isImportingBookmarks}
            className="import-bookmarks-button"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isImportingBookmarks ? 'not-allowed' : 'pointer',
              opacity: isImportingBookmarks ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: '500',
              marginRight: '8px'
            }}
          >
            {isImportingBookmarks ? 'Importing...' : 'Import to BookMarkAgent'}
          </button>
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