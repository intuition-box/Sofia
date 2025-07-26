import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useMCPClient } from '../../hooks/useMCPClient'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const SearchPage = () => {
  const { navigateTo } = useRouter()
  const { isReady, isLoading, error } = useMCPClient()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim() && isReady) {
      localStorage.setItem('searchQuery', searchQuery.trim())
      navigateTo('search-result')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
      </button>
    
      <div className="page-content">
        <input
          type="text"
          placeholder="Search in Intuition blockchain..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button 
          onClick={handleSearch}
          className="search-button"
          disabled={!searchQuery.trim() || !isReady}
        >
          {isLoading ? 'Initializing...' : 'Search in Intuition'}
        </button>
        
        {error && (
          <div className="error-state">
            Connection error: {error}
          </div>
        )}
        
      </div>
    </div>
  )
}


export default SearchPage