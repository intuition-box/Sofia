import { useRouter } from '../layout/RouterProvider'
import '../styles/CommonPage.css'

const SearchPage = () => {
  const { navigateTo } = useRouter()

  return (
    <div className="page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
      </button>
      
      <h2 className="section-title">Search</h2>
      <div className="page-content">
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
        />
        <div className="empty-state">Search results will appear here</div>
      </div>
    </div>
  )
}


export default SearchPage