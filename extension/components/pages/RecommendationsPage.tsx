import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const RecommendationsPage = () => {
  const { navigateTo } = useRouter()

  return (
    <div className="page">
      
      <h2 className="section-title">Recommendations</h2>
      <div className="page-content">
        <div className="empty-state">AI recommendations will appear here</div>
      </div>
    </div>
  )
}


export default RecommendationsPage