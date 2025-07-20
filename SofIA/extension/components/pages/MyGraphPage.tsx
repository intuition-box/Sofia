import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useTracking } from '../../hooks/useTracking'
import { TrackingStats, RecentVisits } from '../tracking'
import '../styles/MyGraphPage.css'

const MyGraphPage = () => {
  const { navigateTo } = useRouter()
  const { stats } = useTracking()
  const [activeGraphTab, setActiveGraphTab] = useState<'my-data' | 'my-triples'>('my-data')

  return (
    <div className="page">
      <button 
        onClick={() => navigateTo('home-connected')}
        className="back-button"
      >
        ← Back to Home
      </button>
      
      <h2 className="section-title">My Graph</h2>
      
      <div className="tabs">
        <button 
          onClick={() => setActiveGraphTab('my-data')}
          className={`tab ${activeGraphTab === 'my-data' ? 'active' : ''}`}
        >
          My Data
        </button>
        <button 
          onClick={() => setActiveGraphTab('my-triples')}
          className={`tab ${activeGraphTab === 'my-triples' ? 'active' : ''}`}
        >
          My triples
        </button>
      </div>
      
      <div className="page-content">
        {activeGraphTab === 'my-data' ? (
          <>
            <TrackingStats 
              totalPages={stats.totalPages}
              totalVisits={stats.totalVisits}
              totalTime={stats.totalTime}
              mostVisitedUrl={stats.mostVisitedUrl}
            />
            <RecentVisits visits={stats.recentVisits} />
          </>
        ) : (
          <div className="triples-container">
            <h3 className="subsection-title">My Triples</h3>
            <div className="empty-state">
              <p>No triples saved yet</p>
              <p className="empty-subtext">Your saved data triples will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


export default MyGraphPage