import React, { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStats, RecentVisits } from '../tracking'

const MyGraphPage: React.FC = () => {
  const { navigateTo } = useRouter()
  const { stats } = useTracking()
  const [activeGraphTab, setActiveGraphTab] = useState<'my-data' | 'my-triplets'>('my-data')

  return (
    <div style={styles.page}>
      <button 
        onClick={() => navigateTo('home-connected')}
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
}

const styles = {
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
  tripletsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  subsectionTitle: {
    fontFamily: "'Gotu', cursive",
    fontSize: '18px',
    fontWeight: '500',
    color: '#F2DED6',
    marginBottom: '10px'
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
  emptySubtext: {
    fontSize: '14px',
    color: '#C7866C',
    fontStyle: 'normal',
    marginTop: '10px'
  }
}

export default MyGraphPage