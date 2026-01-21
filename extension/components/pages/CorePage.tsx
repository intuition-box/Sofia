import { useState, Suspense, lazy, useEffect } from 'react'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const SignalsTab = lazy(() => import('./core-tabs/SignalsTab'))
const PulseTab = lazy(() => import('./core-tabs/PulseTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))


const CorePage = () => {
  const { navigateTo } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'Signals' | 'Pulse' | 'Bookmarks'>('Echoes')
  const [expandedSignalTriplet, setExpandedSignalTriplet] = useState<{ tripletId: string } | null>(null)

  useEffect(() => {
    const targetTab = localStorage.getItem('targetTab')
    if (targetTab === 'Pulse') {
      setActiveGraphTab('Pulse')
      localStorage.removeItem('targetTab') // Clean up after use
    }
  }, [])

  return (
    <div className="page">
      <div className="tabs">
        {['Echoes', 'Signals', 'Pulse', 'Bookmarks'].map(tab => (
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
          {activeGraphTab === 'Signals' && (
            <SignalsTab 
              expandedTriplet={expandedSignalTriplet}
              setExpandedTriplet={setExpandedSignalTriplet}
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
