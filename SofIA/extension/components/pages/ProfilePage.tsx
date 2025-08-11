import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useStorage } from '@plasmohq/storage/hook'
import { useUserProfile } from '../../hooks/useUserProfile'
import '../styles/Global.css'
import '../styles/ProfilePage.css'

const ProfilePage = () => {
  const { navigateTo } = useRouter()
  const [account] = useStorage<string>("metamask-account")
  const {
    profilePhoto,
    bio,
    profileUrl,
    isLoading,
    error,
    updateProfilePhoto,
    updateBio,
    updateProfileUrl,
    getProfileCompletionPercentage
  } = useUserProfile()
  
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [tempBio, setTempBio] = useState('')
  const [tempUrl, setTempUrl] = useState('')

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          await updateProfilePhoto(e.target.result as string)
        } catch (error) {
          console.error('Failed to update profile photo:', error)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBioSave = async () => {
    try {
      await updateBio(tempBio)
      setIsEditingBio(false)
    } catch (error) {
      console.error('Failed to save bio:', error)
    }
  }

  const handleUrlSave = async () => {
    try {
      await updateProfileUrl(tempUrl)
      setIsEditingUrl(false)
    } catch (error) {
      console.error('Failed to save URL:', error)
    }
  }

  const startEditingBio = () => {
    setTempBio(bio || '')
    setIsEditingBio(true)
  }

  const startEditingUrl = () => {
    setTempUrl(profileUrl || '')
    setIsEditingUrl(true)
  }

  const cancelEditing = () => {
    setIsEditingBio(false)
    setIsEditingUrl(false)
    setTempBio('')
    setTempUrl('')
  }

  if (isLoading) {
    return (
      <div className="page profile-page">
        <div className="loading-state">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="page profile-page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
      </button>
      
      <h2 className="section-title">Profile</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="completion-info">
        Profile completion: {getProfileCompletionPercentage()}%
      </div>
      
      {/* Profile Section */}
      <div className="profile-section">
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
          
          <div className="profile-info">
            {/* Wallet Address */}
            {account && (
              <div className="wallet-info">
                <span className="wallet-label">Wallet:</span>
                <span className="wallet-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile URL Section */}
        <div className="profile-field">
          <label className="field-label">Profile URL</label>
          {isEditingUrl ? (
            <div className="field-edit">
              <input
                type="url"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="url-input"
                placeholder="https://sofia.network/profile/username"
              />
              <div className="field-actions">
                <button onClick={handleUrlSave} className="save-button">Save</button>
                <button onClick={cancelEditing} className="cancel-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-display">
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="url-link">
                {profileUrl}
              </a>
              <button onClick={startEditingUrl} className="edit-button">Edit</button>
            </div>
          )}
        </div>

        {/* Bio Section */}
        <div className="profile-field">
          <label className="field-label">Bio</label>
          {isEditingBio ? (
            <div className="field-edit">
              <textarea
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                className="bio-textarea"
                placeholder="Tell us about yourself..."
              />
              <div className="field-actions">
                <button onClick={handleBioSave} className="save-button">Save</button>
                <button onClick={cancelEditing} className="cancel-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-display">
              <p className="bio-text">{bio}</p>
              <button onClick={startEditingBio} className="edit-button">Edit</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage