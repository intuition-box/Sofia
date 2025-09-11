import { useState, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useIntuitionSearch, type AtomSearchResult } from '../../hooks/useIntuitionSearch'
import homeIcon from '../../assets/Icon=home.svg'
import '../styles/Global.css'
import '../styles/CommonPage.css'

interface SearchResultPageProps {
  searchQuery?: string
}

const SearchResultPage = ({ searchQuery: propQuery }: SearchResultPageProps) => {
  const { navigateTo } = useRouter()
  const { searchAtoms, isLoading, error } = useIntuitionSearch()
  const [activeTab, setActiveTab] = useState<'overview' | 'related' | 'about' | 'more'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<AtomSearchResult[]>([])
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [editedQuery, setEditedQuery] = useState('')

  const formatNumber = (num: number) => {
    if (num === 0) return '0'
    if (num >= 1000000000) {
      const formatted = (num / 1000000000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'B' : formatted + 'B'
    }
    if (num >= 1000000) {
      const formatted = (num / 1000000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'M' : formatted + 'M'
    }
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1)
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'K' : formatted + 'K'
    }
    return num.toLocaleString()
  }


  const sortedResults = results.sort((a, b) => b.attestations - a.attestations)
  const topResults = activeTab === 'more' ? sortedResults : sortedResults.slice(0, 3)

  const performSearch = async (query: string) => {
    try {
      const searchResults = await searchAtoms(query)
      setResults(searchResults)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    }
  }

  const handleSearchEdit = () => {
    setEditedQuery(searchQuery)
    setIsEditingSearch(true)
  }

  const handleSearchSave = () => {
    if (editedQuery.trim() && editedQuery.trim() !== searchQuery) {
      setSearchQuery(editedQuery.trim())
      localStorage.setItem('searchQuery', editedQuery.trim())
      performSearch(editedQuery.trim())
    }
    setIsEditingSearch(false)
  }

  const handleSearchCancel = () => {
    setEditedQuery(searchQuery)
    setIsEditingSearch(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSave()
    } else if (e.key === 'Escape') {
      handleSearchCancel()
    }
  }

  useEffect(() => {
    const query = propQuery || localStorage.getItem('searchQuery') || 'Intuition Systems'
    setSearchQuery(query)
    performSearch(query)
  }, [propQuery])

  return (
    <div className="triples-container">
      {/* Header avec recherche et navigation */}
      <div className="search-header">
        <button 
          onClick={() => navigateTo('home-connected')}
          className="back-button"
        >
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={isEditingSearch ? editedQuery : searchQuery}
            onChange={(e) => {
              if (isEditingSearch) {
                setEditedQuery(e.target.value)
              } else {
                setSearchQuery(e.target.value)
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (isEditingSearch) {
                  handleSearchSave()
                } else {
                  const newQuery = (e.target as HTMLInputElement).value.trim()
                  if (newQuery && newQuery !== searchQuery) {
                    setSearchQuery(newQuery)
                    localStorage.setItem('searchQuery', newQuery)
                    performSearch(newQuery)
                  }
                }
              } else if (e.key === 'Escape') {
                if (isEditingSearch) {
                  handleSearchCancel()
                }
              }
            }}
            onFocus={() => {
              if (!isEditingSearch) {
                setEditedQuery(searchQuery)
                setIsEditingSearch(true)
              }
            }}
            onBlur={() => {
              if (isEditingSearch) {
                setTimeout(() => {
                  setIsEditingSearch(false)
                }, 100)
              }
            }}
            className="search-input"
            placeholder="Search atoms in Intuition blockchain..."
            style={{ flex: 1, margin: 0 }}
          />
        </div>
      </div>

      <div className="search-content">

        {isLoading && (
          <div className="empty-state">
            <p>Searching atoms...</p>
            <p className="empty-subtext">
              Searching "{searchQuery}" on Intuition blockchain
            </p>
          </div>
        )}

        {error && (
          <div className="empty-state">
            <p>❌ Search failed</p>
            <p className="empty-subtext">{error}</p>
            <button onClick={() => performSearch(searchQuery)} className="search-button">
              Retry Search
            </button>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="empty-state">
            <p>🔍 No results found</p>
            <p className="empty-subtext">
              No atoms found for "{searchQuery}"<br/>
              Try a different search term or check your spelling
            </p>
            <button onClick={() => performSearch(searchQuery)} className="search-button">
              Search Again
            </button>
          </div>
        )}

        {/* Results list */}
        {!isLoading && !error && results.length > 0 && activeTab !== 'more' && (
          <div className="trending-section">
            {topResults.map((result, index) => (
              <div key={result.id || index} className="echo-card border-green">
                <div className="triplet-item">
                  <div className="triplet-header">
                    <p className="triplet-text">
                      <span className="subject">{result.label}</span><br />
                      <span className="action">is a</span><br />
                      <span className="object">{result.type}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResultPage