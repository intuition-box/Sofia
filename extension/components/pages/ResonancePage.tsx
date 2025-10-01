import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch } from '../../hooks/useIntuitionSearch'
import logoIcon from '../../components/ui/icons/chatIcon.png'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const ResonancePage = () => {
  const { navigateTo } = useRouter()
  const { isReady, searchAtoms } = useIntuitionSearch()
  const [searchQuery, setSearchQuery] = useState('')


  const handleSearch = async () => {
    if (searchQuery.trim() && isReady) {
      try {
        const results = await searchAtoms(searchQuery.trim())
        localStorage.setItem('searchQuery', searchQuery.trim())
        localStorage.setItem('searchResults', JSON.stringify(results))
        navigateTo('search-result')
      } catch (error) {
        console.error('Search failed:', error)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="triples-container">
      <div className="search-content">
        <div className="search-input-container">
          <img src={logoIcon} alt="Sofia" className="search-logo" />
          <input
            type="text"
            placeholder="Search atoms in Intuition blockchain..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="empty-state">
          <p> Search Intuition Network</p>
          <p className="empty-subtext">
            Enter a search term above to find atoms and triplets on the Intuition blockchain
          </p>
        </div>
        
      </div>
    </div>
  )
}


export default ResonancePage