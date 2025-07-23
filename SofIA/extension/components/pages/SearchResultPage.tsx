import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CommonPage.css'
import '../styles/SearchResultPage.css'

interface SearchResultPageProps {
  searchQuery?: string
}

const SearchResultPage = ({}: SearchResultPageProps) => {
  const { navigateTo } = useRouter()

  return (
    <div className="page search-result-page">
      <div className="search-result-header">
        <div className="search-header-bar">
          <span className="search-query">Search Results</span>
          <button 
            onClick={() => navigateTo('search')}
            className="close-button"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="search-result-content">
        <div className="main-title-section">
          <h1 className="main-title">Search Results</h1>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '16px'
        }}>
          This page is ready for future agent integration.
        </div>
      </div>
    </div>
  )
}

export default SearchResultPage