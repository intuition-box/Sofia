import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStatus } from '../tracking'
import WalletConnectionButton from '../THP_WalletConnectionButton'
import { Storage } from '@plasmohq/storage'
import { disconnectWallet, cleanupProvider } from '../../lib/metamask'
import { useStorage } from '@plasmohq/storage/hook'
import '../styles/Global.css'
import '../styles/SettingsPage.css'

const SettingsPage = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()
  const [isDataSharingEnabled, setIsDataSharingEnabled] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  
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

  return (
    <div className="page settings-page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
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

      {/* Developer Tools Section */}
      <div className="settings-section">
        <h3 className="settings-section-title">Developer Tools</h3>
        
        <div className="settings-item">
          <span>Data Seeder</span>
          <button 
            onClick={() => navigateTo('seed')}
            className="seed-button"
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            🌱 Seed Test Data
          </button>
        </div>
      </div>
    </div>
  )
}


export default SettingsPage