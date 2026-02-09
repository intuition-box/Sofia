import { useState, Suspense, lazy, useEffect } from 'react'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const HistoryTab = lazy(() => import('./core-tabs/HistoryTab'))
const PulseTab = lazy(() => import('./core-tabs/PulseTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))


const CorePage = () => {
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'History' | 'Pulse' | 'Bookmarks'>('Echoes')
  const [expandedHistoryTriplet, setExpandedHistoryTriplet] = useState<{ tripletId: string } | null>(null)

  useEffect(() => {
    const targetTab = localStorage.getItem('targetTab')
    if (targetTab === 'Pulse') {
      setActiveGraphTab('Pulse')
      localStorage.removeItem('targetTab')
    }
  }, [])

  return (
    <div className="page">
      <div className="tabs">
        {['Echoes', 'Pulse', 'History', 'Bookmarks'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveGraphTab(tab as any)}
            className={`tab ${activeGraphTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state">Loading...</div>}>
          {activeGraphTab === 'Echoes' && <EchoesTab />}
          {activeGraphTab === 'History' && (
            <HistoryTab
              expandedTriplet={expandedHistoryTriplet}
              setExpandedTriplet={setExpandedHistoryTriplet}
            />
          )}
          {activeGraphTab === 'Pulse' && <PulseTab />}
          {activeGraphTab === 'Bookmarks' && <BookmarkTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CorePage
