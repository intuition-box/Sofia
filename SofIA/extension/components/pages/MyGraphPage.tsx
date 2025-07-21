import { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import { useAgentMessages } from '../../hooks/useAgentMessages'
import LiquidGlass from '../ui/LiquidGlass'
import '../styles/MyGraphPage.css'

const MyGraphPage = () => {
  const { navigateTo } = useRouter()
  const { rawMessages, triplets } = useAgentMessages()
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
          My Triples
        </button>
      </div>
      
      <div className="page-content">
        {activeGraphTab === 'my-data' ? (
          <div className="agent-data-section">
            <h3 className="subsection-title">Agent Messages</h3>
            {rawMessages.length > 0 ? (
              <div className="agent-message-list">
                {rawMessages.map((msg, idx) => (
                  <div key={idx}>
                    <div className="agent-message">{msg}</div>
                    {idx < rawMessages.length - 1 && (
                      <LiquidGlass height="3px" className="response-separator" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No messages received yet</p>
                <p className="empty-subtext">Agent messages will appear here when available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="triples-container">
            <h3 className="subsection-title">My Triples</h3>
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
                <p>No triples saved yet</p>
                <p className="empty-subtext">Your saved data triples will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyGraphPage
