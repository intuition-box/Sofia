import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import homeIcon from '../../assets/Icon=home.svg'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const SearchPage = () => {
  const { navigateTo } = useRouter()
  const { isReady, isLoading, error } = useIntuitionSearch()
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
        <img src={homeIcon} alt="Home" className="home-icon" />
      </button>
    
      <div className="page-content">
        <input
          type="text"
          placeholder="Search atoms in Intuition blockchain..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        
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