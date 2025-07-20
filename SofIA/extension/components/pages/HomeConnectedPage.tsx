import React, { useState } from 'react'
import { useTracking } from '../../hooks/useTracking'
import { useRouter } from '../layout/RouterProvider'
import logoIcon from '../../assets/iconcolored.png'
import thumbsUpIcon from '../ui/Thumbs up.png'
import toggleTrue from '../ui/button=True.png'
import toggleFalse from '../ui/button=False.png'

const HomeConnectedPage: React.FC = () => {
  const [chatInput, setChatInput] = useState("")
  const { navigateTo } = useRouter()
  const { isTrackingEnabled, toggleTracking } = useTracking()

  return (
    <div style={styles.homeConnectedPage}>
      <div style={styles.chatSection}>
        <div style={styles.chatInputContainer}>
          <img 
            src={logoIcon} 
            alt="Sofia" 
            style={styles.chatLogo} 
          />
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Talk with Sofia..."
            style={styles.chatInput}
          />
        </div>
      </div>
      
      <div style={styles.favoritesSection}>
        <h3 style={styles.subsectionTitle}>Favorites</h3>
        <p style={styles.favoritesEmptyText}>No favorites yet</p>
      </div>
      
      <div style={styles.floatingButtons}>
        <button 
          onClick={toggleTracking}
          style={styles.floatingButtonCheck}
          title={isTrackingEnabled ? "Tracking enabled" : "Tracking disabled"}
        >
          <img 
            src={isTrackingEnabled ? toggleTrue : toggleFalse} 
            alt={isTrackingEnabled ? "Enabled" : "Disabled"} 
            style={styles.toggleIcon}
          />
        </button>
        <button 
          onClick={() => navigateTo('recommendations')}
          style={styles.floatingButton}
        >
          <img 
            src={thumbsUpIcon} 
            alt="Recommendations" 
            style={styles.floatingIcon}
          />
        </button>
      </div>
    </div>
  )
}

const styles = {
  homeConnectedPage: {
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
  chatSection: {
    marginBottom: '30px'
  },
  chatInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  chatLogo: {
    width: '24px',
    height: '24px',
    flexShrink: 0
  },
  chatInput: {
    flex: 1,
    padding: '0',
    border: 'none',
    borderRadius: '0',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: '#F2DED6',
    outline: 'none',
    fontFamily: "'Montserrat', sans-serif"
  },
  favoritesSection: {
    marginBottom: '30px'
  },
  favoritesEmptyText: {
    color: '#F2DED6',
    fontSize: '14px',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    marginTop: '10px'
  },
  subsectionTitle: {
    fontFamily: "'Gotu', cursive",
    fontSize: '18px',
    fontWeight: '500',
    color: '#F2DED6',
    marginBottom: '10px'
  },
  floatingButtons: {
    position: 'fixed' as const,
    right: '20px',
    top: '550px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '12px',
    zIndex: 5
  },
  floatingButton: {
    width: '80px',
    height: '80px',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0',
    margin: '0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  floatingButtonCheck: {
    width: '80px',
    height: '60px',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '0',
    margin: '0',
    marginBottom: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'left',
    justifyContent: 'left',
    transition: 'all 0.3s ease'
  },
  floatingIcon: {
    transition: 'all 0.3s ease'
  },
  toggleIcon: {
    width: '80px',
    height: '80px',
    transition: 'all 0.3s ease'
  }
}

export default HomeConnectedPage