import { useState, Suspense, lazy, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const HistoryTab = lazy(() => import('./core-tabs/HistoryTab'))
const PulseTab = lazy(() => import('./core-tabs/PulseTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))
const SkillsTab = lazy(() => import('./core-tabs/SkillsTab'))


const CorePage = () => {
  const { navigateTo } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'History' | 'Pulse' | 'Proofs' | 'Bookmarks'>('Echoes')
  const [expandedHistoryTriplet, setExpandedHistoryTriplet] = useState<{ tripletId: string } | null>(null)

  useEffect(() => {
    const targetTab = localStorage.getItem('targetTab')
    if (targetTab === 'Pulse' || targetTab === 'Proofs') {
      setActiveGraphTab(targetTab as 'Pulse' | 'Proofs')
      localStorage.removeItem('targetTab') // Clean up after use
    }
  }, [])

  return (
    <div className="page">
      <div className="tabs">
        {['Echoes', 'Pulse', 'Proofs', 'History', 'Bookmarks'].map(tab => (
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
          {activeGraphTab === 'Echoes' && <EchoesTab onNavigateToProofs={() => setActiveGraphTab('Proofs')} />}
          {activeGraphTab === 'History' && (
            <HistoryTab
              expandedTriplet={expandedHistoryTriplet}
              setExpandedTriplet={setExpandedHistoryTriplet}
            />
          )}
          {activeGraphTab === 'Pulse' && <PulseTab />}
          {activeGraphTab === 'Proofs' && <SkillsTab />}
          {activeGraphTab === 'Bookmarks' && <BookmarkTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CorePage
