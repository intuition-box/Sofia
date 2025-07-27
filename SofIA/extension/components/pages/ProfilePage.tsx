import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { Storage } from '@plasmohq/storage'
import { useStorage } from '@plasmohq/storage/hook'
import '../styles/Global.css'
import '../styles/ProfilePage.css'

const ProfilePage = () => {
  const { navigateTo } = useRouter()
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [bio, setBio] = useState("Passionate about technology, digital identity, and decentralized systems. I enjoy exploring the intersection of innovation and human connection online. Currently working on projects that leverage blockchain for social impact. Always open to collaboration and meaningful conversations.")
  const [profileUrl, setProfileUrl] = useState("https://sofia.network/profile/username")
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  
  const storage = new Storage()
  const [account] = useStorage<string>("metamask-account")

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

  const handleUrlSave = () => {
    setIsEditingUrl(false)
    // Ici on pourrait sauvegarder l'URL dans le localStorage ou via une API
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
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                className="url-input"
                placeholder="https://sofia.network/profile/username"
              />
              <div className="field-actions">
                <button onClick={handleUrlSave} className="save-button">Save</button>
                <button onClick={() => setIsEditingUrl(false)} className="cancel-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-display">
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="url-link">
                {profileUrl}
              </a>
              <button onClick={() => setIsEditingUrl(true)} className="edit-button">Edit</button>
            </div>
          )}
        </div>

        {/* Bio Section */}
        <div className="profile-field">
          <label className="field-label">Bio</label>
          {isEditingBio ? (
            <div className="field-edit">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bio-textarea"
                placeholder="Tell us about yourself..."
              />
              <div className="field-actions">
                <button onClick={handleBioSave} className="save-button">Save</button>
                <button onClick={() => setIsEditingBio(false)} className="cancel-button">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="field-display">
              <p className="bio-text">{bio}</p>
              <button onClick={() => setIsEditingBio(true)} className="edit-button">Edit</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage