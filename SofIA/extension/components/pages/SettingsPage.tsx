import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStatus } from '../tracking'
import WalletConnectionButton from '../THP_WalletConnectionButton'
import { Storage } from '@plasmohq/storage'
import '../styles/Global.css'
import '../styles/SettingsPage.css'

const SettingsPage = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()
  const [isDataSharingEnabled, setIsDataSharingEnabled] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [bio, setBio] = useState("Passionate about technology, digital identity, and decentralized systems. I enjoy exploring the intersection of innovation and human connection online. Currently working on projects that leverage blockchain for social impact. Always open to collaboration and meaningful conversations.")
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  
  const storage = new Storage()

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhoto(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBioSave = () => {
    setIsEditingBio(false)
    // Ici on pourrait sauvegarder la bio dans le localStorage ou via une API
  }

  const handleClearStorage = async () => {
    if (!confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
      return
    }
    
    setIsClearing(true)
    try {
      await storage.clear()
      console.log("🧹 Plasmo Storage cleared successfully")
      alert('Storage cleared successfully!')
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
      
      {/* Profile Section */}
      <div className="settings-section">
        <div className="profile-header">
          <div className="profile-photo-container">
            <div className="profile-photo">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="profile-image" />
              ) : (
                <div className="profile-placeholder">
                  <span>👤</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="photo-input"
              id="photo-input"
            />
            <label htmlFor="photo-input" className="photo-upload-button">
              Change Photo
            </label>
          </div>
          
          <div className="bio-section">
            {isEditingBio ? (
              <div className="bio-edit">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bio-textarea"
                  placeholder="Tell us about yourself..."
                />
                <div className="bio-actions">
                  <button onClick={handleBioSave} className="save-button">Save</button>
                  <button onClick={() => setIsEditingBio(false)} className="cancel-button">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="bio-display">
                <p className="bio-text">{bio}</p>
                <button onClick={() => setIsEditingBio(true)} className="edit-button">Edit</button>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  )
}


export default SettingsPage