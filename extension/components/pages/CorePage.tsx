import { useState, useTransition, Suspense, lazy, useEffect } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const PulseTab = lazy(() => import('./core-tabs/PulseTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))


const CorePage = () => {
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'Pulse' | 'Bookmarks'>('Echoes')
  const [, startTransition] = useTransition()

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
        {['Echoes', 'Pulse', 'Bookmarks'].map(tab => (
          <button
            key={tab}
            onClick={() => startTransition(() => setActiveGraphTab(tab as typeof activeGraphTab))}
            className={`tab ${activeGraphTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={40} /></div>}>
          {activeGraphTab === 'Echoes' && <EchoesTab />}
          {activeGraphTab === 'Pulse' && <PulseTab />}
          {activeGraphTab === 'Bookmarks' && <BookmarkTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CorePage
