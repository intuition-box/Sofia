import React from 'react'
import { useRouter } from '../layout/RouterProvider'

const SearchPage: React.FC = () => {
  const { navigateTo } = useRouter()

  return (
    <div style={styles.page}>
      <button 
        onClick={() => navigateTo('home-connected')}
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
  }
}

export default SearchPage