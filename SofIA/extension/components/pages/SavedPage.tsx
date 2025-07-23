import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CommonPage.css'

const SavedPage = () => {
  const { navigateTo } = useRouter()

  return (
    <div className="page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
      </button>
      
      <h2 className="section-title">Saved</h2>
      <div className="page-content">
        <div className="empty-state">Your saved items will appear here</div>
      </div>
    </div>
  )
}


export default SavedPage