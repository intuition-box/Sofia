import { useRouter } from '../layout/RouterProvider'
import '../styles/CommonPage.css'

const RecommendationsPage = () => {
  const { navigateTo } = useRouter()

  return (
    <div className="page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
      </button>
      
      <h2 className="section-title">Recommendations</h2>
      <div className="page-content">
        <div className="empty-state">AI recommendations will appear here</div>
      </div>
    </div>
  )
}


export default RecommendationsPage