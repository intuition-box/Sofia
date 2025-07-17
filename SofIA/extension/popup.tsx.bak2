import { useState } from "react"
import WalletConnectionButton from "./components/THP_WalletConnectionButton"
import { TrackingStatus, TrackingStats, TrackingActions, RecentVisits } from "./components/tracking"
import { useTracking } from "./hooks/useTracking"

function IndexPopup() {
  const [data, setData] = useState("")
  const [activeTab, setActiveTab] = useState<'wallet' | 'tracking'>('wallet')
  
  const {
    isTrackingEnabled,
    stats,
    isLoading,
    toggleTracking,
    exportData,
    clearData,
    viewConsole
  } = useTracking()

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🚀 SOFIA Extension</h2>
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('wallet')}
            style={activeTab === 'wallet' ? styles.activeTab : styles.tab}
          >
            💰 Wallet
          </button>
          <button 
            onClick={() => setActiveTab('tracking')}
            style={activeTab === 'tracking' ? styles.activeTab : styles.tab}
          >
            📊 Tracking
          </button>
        </div>
      </div>

      {activeTab === 'wallet' && (
        <div style={styles.tabContent}>
          <WalletConnectionButton />
          
          <div style={styles.separator} />
          
          <div style={styles.inputSection}>
            <input 
              onChange={(e) => setData(e.target.value)} 
              value={data} 
              placeholder="Test input..."
              style={styles.input}
            />
            <a href="https://docs.plasmo.com" target="_blank" style={styles.link}>
              View Plasmo Docs
            </a>
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div style={styles.tabContent}>
          {isLoading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingText}>Chargement des données...</div>
            </div>
          ) : (
            <>
              <TrackingStatus 
                isEnabled={isTrackingEnabled}
                onToggle={toggleTracking}
              />
              
              <TrackingStats 
                totalPages={stats.totalPages}
                totalVisits={stats.totalVisits}
                totalTime={stats.totalTime}
                mostVisitedUrl={stats.mostVisitedUrl}
              />
              
              <RecentVisits visits={stats.recentVisits} />
              
              <TrackingActions 
                onExportData={exportData}
                onClearData={clearData}
                onViewConsole={viewConsole}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    width: '350px',
    minHeight: '400px',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa'
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#212529'
  },
  tabs: {
    display: 'flex',
    gap: '4px'
  },
  tab: {
    flex: '1',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6c757d',
    transition: 'all 0.2s'
  },
  activeTab: {
    flex: '1',
    padding: '8px 12px',
    backgroundColor: '#007bff',
    border: '1px solid #007bff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#ffffff',
    transition: 'all 0.2s'
  },
  tabContent: {
    padding: '16px',
    maxHeight: '500px',
    overflowY: 'auto' as const
  },
  separator: {
    height: '1px',
    backgroundColor: '#e9ecef',
    margin: '16px 0'
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  loadingText: {
    fontSize: '14px',
    color: '#6c757d',
    fontStyle: 'italic'
  }
}

export default IndexPopup