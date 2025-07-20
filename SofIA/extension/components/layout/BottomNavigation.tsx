import React from 'react'
import { useStorage } from "@plasmohq/storage/hook"
import { useRouter } from './RouterProvider'
import graphIcon from '../../assets/Icon=Graph.svg'
import bookmarkIcon from '../../assets/Icon=Bookmark.svg'
import searchIcon from '../../assets/Icon=Search.svg'
import settingsIcon from '../../assets/Icon=Settings.svg'

const BottomNavigation = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()

  if (!account) return null

  return (
    <div style={styles.bottomNav}>
      <button 
        onClick={() => navigateTo('my-graph')}
        style={currentPage === 'my-graph' ? styles.activeNavButtonMyGraph : styles.activeNavButtonMyGraph}
      >
        <img 
          src={graphIcon} 
          alt="My Graph" 
          style={styles.navIcon}
        />
        <span style={styles.navText}>My Graph</span>
      </button>
      <button 
        onClick={() => navigateTo('saved')}
        style={currentPage === 'saved' ? styles.activeNavButton : styles.navButton}
      >
        <img 
          src={bookmarkIcon} 
          alt="Saved" 
          style={styles.navIcon}
        />
        <span style={styles.navText}>Saved</span>
      </button>
      <button 
        onClick={() => navigateTo('search')}
        style={currentPage === 'search' ? styles.activeNavButton : styles.navButton}
      >
        <img 
          src={searchIcon} 
          alt="Search" 
          style={styles.navIcon}
        />
        <span style={styles.navText}>Search</span>
      </button>
      <button 
        onClick={() => navigateTo('settings')}
        style={currentPage === 'settings' ? styles.activeNavButton : styles.navButton}
      >
        <img 
          src={settingsIcon} 
          alt="Settings" 
          style={styles.navIcon}
        />
        <span style={styles.navText}>Settings</span>
      </button>
    </div>
  )
}

const styles = {
  bottomNav: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backdropFilter: 'blur(20px) saturate(100%)',
    WebkitBackdropFilter: 'blur(20px) saturate(100%)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 3,
    borderTop: '1px solid rgba(242, 222, 214, 0.2)',
    boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  },
  navButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#F2DED6',
    fontSize: '10px',
    cursor: 'pointer',
    padding: '8px 4px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.3s ease',
    minWidth: '60px'
  },
  activeNavButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#FBF7F5',
    fontSize: '10px',
    cursor: 'pointer',
    padding: '8px 4px',
    borderRadius: '8px',
    fontWeight: '600',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.3s ease',
    minWidth: '60px'
  },
  activeNavButtonMyGraph: {
    background: 'linear-gradient(135deg, #DB6B3E 0%, #C7866C 100%)',
    border: 'none',
    color: '#FBF7F5',
    fontSize: '10px',
    cursor: 'pointer',
    padding: '8px 4px',
    borderRadius: '8px',
    fontWeight: '600',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.3s ease',
    minWidth: '60px',
    boxShadow: '0 4px 16px rgba(219, 107, 62, 0.3)'
  },
  navIcon: {
    width: '20px',
    height: '20px',
    filter: 'brightness(0) saturate(100%) invert(91%) sepia(6%) saturate(346%) hue-rotate(314deg) brightness(97%) contrast(88%)'
  },
  navText: {
    fontSize: '10px',
    fontWeight: '500'
  }
}

export default BottomNavigation