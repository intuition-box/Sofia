import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useAgentMessages } from '../../hooks/useAgentMessages'
import LiquidGlass from '../ui/LiquidGlass'
import '../styles/Global.css'
import '../styles/MyGraphPage.css'

const MyGraphPage = () => {
  const { navigateTo } = useRouter()
  const { triplets, session, intention } = useAgentMessages()
  const [activeGraphTab, setActiveGraphTab] = useState<'my-data' | 'my-triples' | 'my-summary'>('my-data')

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
          My Triples
        </button>
        <button 
          onClick={() => setActiveGraphTab('my-summary')}
          className={`tab ${activeGraphTab === 'my-summary' ? 'active' : ''}`}
        >
          Summary
        </button>
      </div>
      
      <div className="page-content">
        {activeGraphTab === 'my-data' && (
          <div className="triples-container">
            <h3 className="subsection-title">Extracted Triplets</h3>
            {triplets.length > 0 ? (
              <div className="triples-list">
                {triplets.map((t, i) => (
                  <div key={i}>
                    <div className="triple-item">{t}</div>
                    {i < triplets.length - 1 && (
                      <LiquidGlass height="2px" className="triple-separator" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No triplets extracted yet</p>
                <p className="empty-subtext">Agent triplets will appear here</p>
              </div>
            )}
          </div>
        )}

        {activeGraphTab === 'my-triples' && (
          <div className="triples-container">
            <h3 className="subsection-title">Blockchain Triplets</h3>
            <div className="empty-state">
              <p>No triples registered yet</p>
              <p className="empty-subtext">Your validated triplets will appear here once stored on-chain</p>
            </div>
          </div>
        )}

        {activeGraphTab === 'my-summary' && (
          <div className="summary-section">
            <h3 className="subsection-title">🧠 Session Summary</h3>
            {session ? (
              <p><strong>Session:</strong> {session}</p>
            ) : (
              <p className="empty-state">No session detected yet</p>
            )}

            {intention ? (
              <p><strong>Intention:</strong> {intention}</p>
            ) : (
              <p className="empty-state">No intention detected yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyGraphPage
