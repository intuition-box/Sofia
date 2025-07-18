import { useState, useEffect } from "react"
import WalletConnectionButton from "./components/THP_WalletConnectionButton"
import { TrackingStatus, TrackingStats, RecentVisits } from "./components/tracking"
import { useTracking } from "./hooks/useTracking"
import SplineBackground from "./components/Splinebackground"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

type Page = 'home' | 'settings' | 'home-connected' | 'my-graph' | 'recommendations' | 'saved' | 'search'

function SidePanel() {
  const [account] = useStorage<string>("metamask-account")
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [chatInput, setChatInput] = useState("")
  const [activeGraphTab, setActiveGraphTab] = useState<'my-data' | 'my-triplets'>('my-data')
  
  const {
    isTrackingEnabled,
    stats,
    toggleTracking
  } = useTracking()

  // Gestion automatique de la page selon l'état de connexion
  useEffect(() => {
    if (account && currentPage === 'home') {
      setCurrentPage('home-connected')
    } else if (!account && currentPage !== 'home') {
      setCurrentPage('home')
    }
  }, [account, currentPage])

  // Page d'accueil initiale (avant connexion)
  const HomePage = () => (
    <div style={styles.homePage}>
      <div style={styles.logoContainer}>
        <img src={chrome.runtime.getURL("assets/iconcolored.png")} alt="Sofia" style={styles.logo} />
      </div>
      <h1 style={styles.welcomeTitle}>Welcome to Sofia</h1>
      <div style={styles.connectSection}>
        <WalletConnectionButton />
      </div>
    </div>
  )

  // Page d'accueil après connexion
  const HomeConnectedPage = () => (
    <div style={styles.homeConnectedPage}>
      <div style={styles.chatSection}>
        <h2 style={styles.sectionTitle}>Talk with Sophia</h2>
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask Sophia anything..."
          style={styles.chatInput}
        />
      </div>
      
      <div style={styles.favoritesSection}>
        <h3 style={styles.subsectionTitle}>Favorites</h3>
        <div style={styles.favoritesList}>
          <div style={styles.emptyState}>No favorites yet</div>
        </div>
      </div>
      
      <div style={styles.sideActions}>
        <button 
          onClick={() => setCurrentPage('recommendations')}
          style={styles.actionButton}
        >
          Recommendations
        </button>
        <div style={styles.trackingToggle}>
          <TrackingStatus 
            isEnabled={isTrackingEnabled}
            onToggle={toggleTracking}
          />
        </div>
      </div>
    </div>
  )

  // Page Settings
  const SettingsPage = () => (
    <div style={styles.settingsPage}>
      <button 
        onClick={() => setCurrentPage('home-connected')}
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

  // Page My Graph
  const MyGraphPage = () => (
    <div style={styles.page}>
      <button 
        onClick={() => setCurrentPage('home-connected')}
        style={styles.backButton}
      >
        ← Back to Home
      </button>
      
      <h2 style={styles.sectionTitle}>My Graph</h2>
      
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveGraphTab('my-data')}
          style={activeGraphTab === 'my-data' ? styles.activeTab : styles.tab}
        >
          My Data
        </button>
        <button 
          onClick={() => setActiveGraphTab('my-triplets')}
          style={activeGraphTab === 'my-triplets' ? styles.activeTab : styles.tab}
        >
          My Triplets
        </button>
      </div>
      
      <div style={styles.pageContent}>
        {activeGraphTab === 'my-data' ? (
          <>
            <TrackingStats 
              totalPages={stats.totalPages}
              totalVisits={stats.totalVisits}
              totalTime={stats.totalTime}
              mostVisitedUrl={stats.mostVisitedUrl}
            />
            <RecentVisits visits={stats.recentVisits} />
          </>
        ) : (
          <div style={styles.tripletsContainer}>
            <h3 style={styles.subsectionTitle}>My Triplets</h3>
            <div style={styles.emptyState}>
              <p>No triplets saved yet</p>
              <p style={styles.emptySubtext}>Your saved data triplets will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Page Recommendations
  const RecommendationsPage = () => (
    <div style={styles.page}>
      <button 
        onClick={() => setCurrentPage('home-connected')}
        style={styles.backButton}
      >
        ← Back to Home
      </button>
      
      <h2 style={styles.sectionTitle}>Recommendations</h2>
      <div style={styles.pageContent}>
        <div style={styles.emptyState}>AI recommendations will appear here</div>
      </div>
    </div>
  )

  // Page Saved
  const SavedPage = () => (
    <div style={styles.page}>
      <button 
        onClick={() => setCurrentPage('home-connected')}
        style={styles.backButton}
      >
        ← Back to Home
      </button>
      
      <h2 style={styles.sectionTitle}>Saved</h2>
      <div style={styles.pageContent}>
        <div style={styles.emptyState}>Your saved items will appear here</div>
      </div>
    </div>
  )

  // Page Search
  const SearchPage = () => (
    <div style={styles.page}>
      <button 
        onClick={() => setCurrentPage('home-connected')}
        style={styles.backButton}
      >
        ← Back to Home
      </button>
      
      <h2 style={styles.sectionTitle}>Search</h2>
      <div style={styles.pageContent}>
        <input
          type="text"
          placeholder="Search..."
          style={styles.searchInput}
        />
        <div style={styles.emptyState}>Search results will appear here</div>
      </div>
    </div>
  )

  // Rendu de la page actuelle
  const renderCurrentPage = () => {
    if (!account) return <HomePage />
    
    switch (currentPage) {
      case 'home':
      case 'home-connected':
        return <HomeConnectedPage />
      case 'settings':
        return <SettingsPage />
      case 'my-graph':
        return <MyGraphPage />
      case 'recommendations':
        return <RecommendationsPage />
      case 'saved':
        return <SavedPage />
      case 'search':
        return <SearchPage />
      default:
        return <HomeConnectedPage />
    }
  }

  // Navigation bottom menu (seulement si connecté)
  const BottomNavigation = () => {
    if (!account) return null
    
    return (
      <div style={styles.bottomNav}>
        <button 
          onClick={() => setCurrentPage('my-graph')}
          style={currentPage === 'my-graph' ? styles.activeNavButton : styles.navButton}
        >
          My Graph
        </button>
        <button 
          onClick={() => setCurrentPage('saved')}
          style={currentPage === 'saved' ? styles.activeNavButton : styles.navButton}
        >
          Saved
        </button>
        <button 
          onClick={() => setCurrentPage('search')}
          style={currentPage === 'search' ? styles.activeNavButton : styles.navButton}
        >
          Search
        </button>
        <button 
          onClick={() => setCurrentPage('settings')}
          style={currentPage === 'settings' ? styles.activeNavButton : styles.navButton}
        >
          Settings
        </button>
        <button 
          onClick={() => setCurrentPage('home-connected')}
          style={currentPage === 'home-connected' ? styles.activeNavButton : styles.navButton}
        >
          Home
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <SplineBackground />
      {account && (
        <div style={styles.overlay} />
      )}
      
      <div style={styles.content}>
        {renderCurrentPage()}
      </div>
      
      <BottomNavigation />
    </div>
  )
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    minHeight: '100vh',
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 14, 14, 0.18)',
    zIndex: 1
  },
  content: {
    position: 'relative' as const,
    zIndex: 2,
    minHeight: 'calc(100vh - 60px)',
    paddingBottom: '60px'
  },
  
  // Page d'accueil
  homePage: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center' as const
  },
  logoContainer: {
    marginBottom: '30px'
  },
  logo: {
    width: '80px',
    height: '80px'
  },
  welcomeTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: '32px',
    fontWeight: '700',
    color: '#FBF7F5',
    marginBottom: '40px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
  },
  connectSection: {
    marginTop: '20px'
  },
  
  // Page d'accueil connectée
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
  sectionTitle: {
    fontFamily: "'Gotu', cursive",
    fontSize: '24px',
    fontWeight: '600',
    color: '#FBF7F5',
    marginBottom: '15px'
  },
  chatInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    borderRadius: '12px',
    fontSize: '16px',
    backgroundColor: 'rgba(251, 247, 245, 0.9)',
    color: '#372118',
    outline: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    transition: 'all 0.3s ease'
  },
  favoritesSection: {
    marginBottom: '30px'
  },
  subsectionTitle: {
    fontFamily: "'Gotu', cursive",
    fontSize: '18px',
    fontWeight: '500',
    color: '#F2DED6',
    marginBottom: '10px'
  },
  favoritesList: {
    minHeight: '100px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '15px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  sideActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
  },
  actionButton: {
    padding: '12px 24px',
    backgroundColor: 'rgba(199, 134, 108, 0.8)',
    color: '#FBF7F5',
    border: '1px solid rgba(199, 134, 108, 0.3)',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(199, 134, 108, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    transition: 'all 0.3s ease'
  },
  trackingToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  
  // Page Settings
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
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '8px 16px',
    borderRadius: '8px',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
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
  },
  
  // Pages génériques
  page: {
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
  pageContent: {
    marginTop: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '20px',
    borderRadius: '16px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#FBF7F5',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    borderRadius: '8px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  activeTab: {
    padding: '10px 20px',
    backgroundColor: 'rgba(199, 134, 108, 0.8)',
    color: '#FBF7F5',
    border: '1px solid rgba(199, 134, 108, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 8px 32px rgba(199, 134, 108, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.125)',
    borderRadius: '12px',
    fontSize: '16px',
    backgroundColor: 'rgba(251, 247, 245, 0.9)',
    color: '#372118',
    outline: 'none',
    marginBottom: '20px',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#F2DED6',
    fontStyle: 'italic',
    padding: '30px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  },
  tripletsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#C7866C',
    fontStyle: 'normal',
    marginTop: '10px'
  },
  
  // Navigation bottom
  bottomNav: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: 'rgba(55, 33, 24, 0.95)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#F2DED6',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    backdropFilter: 'blur(5px) saturate(100%)',
    WebkitBackdropFilter: 'blur(5px) saturate(100%)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  },
  activeNavButton: {
    backgroundColor: 'rgba(199, 134, 108, 0.8)',
    border: '1px solid rgba(199, 134, 108, 0.3)',
    color: '#FBF7F5',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '8px',
    fontWeight: '600',
    backdropFilter: 'blur(10px) saturate(100%)',
    WebkitBackdropFilter: 'blur(10px) saturate(100%)',
    boxShadow: '0 4px 16px rgba(199, 134, 108, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease'
  }
}

export default SidePanel