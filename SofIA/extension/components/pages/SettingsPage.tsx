import React from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStatus } from '../tracking'
import WalletConnectionButton from '../THP_WalletConnectionButton'

const SettingsPage: React.FC = () => {
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()

  return (
    <div style={styles.settingsPage}>
      <button 
        onClick={() => navigateTo('home-connected')}
        style={styles.backButton}
      >
        ← Back to Home
      </button>
      
      <h2 style={styles.sectionTitle}>Settings</h2>
      
      <div style={styles.settingsSection}>
        <button style={styles.settingsItem}>
          <span>Edit Profile</span>
          <span style={styles.settingsSubtext}>Bio & Photo</span>
        </button>
        
        <div style={styles.settingsItem}>
          <span>Data Tracking</span>
          <TrackingStatus 
            isEnabled={isTrackingEnabled}
            onToggle={toggleTracking}
          />
        </div>
        
        <div style={styles.settingsItem}>
          <span>Language</span>
          <select style={styles.select}>
            <option>English</option>
            <option>Français</option>
          </select>
        </div>
        
        <div style={styles.settingsItem}>
          <span>Data Sharing</span>
          <input type="checkbox" style={styles.checkbox} />
        </div>
        
        <div style={styles.settingsItem}>
          <span>Wallet</span>
          <WalletConnectionButton />
        </div>
      </div>
    </div>
  )
}

const styles = {
  settingsPage: {
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    margin: '10px',
    borderRadius: '20px',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease'
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#F2DED6',
    fontSize: '12px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '8px 16px',
    borderRadius: '8px',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  },
  sectionTitle: {
    fontFamily: "'Gotu', cursive",
    fontSize: '24px',
    fontWeight: '600',
    color: '#FBF7F5',
    marginBottom: '15px'
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  settingsItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    color: '#FBF7F5',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  settingsSubtext: {
    fontSize: '14px',
    color: '#F2DED6'
  },
  select: {
    backgroundColor: 'rgba(251, 247, 245, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    padding: '8px 12px',
    borderRadius: '8px',
    color: '#372118',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  checkbox: {
    width: '20px',
    height: '20px'
  }
}

export default SettingsPage