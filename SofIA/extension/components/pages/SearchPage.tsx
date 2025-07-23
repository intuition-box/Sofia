import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const SearchPage = () => {
  const { navigateTo } = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = () => {
    if (searchQuery.trim()) {
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
          disabled={!searchQuery.trim()}
        >
          Search in Intuition
        </button>
        
        
      </div>
    </div>
  )
}


export default SearchPage