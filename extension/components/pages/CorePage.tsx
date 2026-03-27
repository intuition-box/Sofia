import { useState, useTransition, Suspense, lazy } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))


const CorePage = () => {
  const [activeGraphTab, setActiveGraphTab] = useState<'Echoes' | 'Bookmarks'>('Echoes')
  const [, startTransition] = useTransition()

  return (
    <div className="page">
      <div className="tabs">
        {['Echoes', 'Bookmarks'].map(tab => (
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
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeGraphTab === 'Echoes' && <EchoesTab />}
          {activeGraphTab === 'Bookmarks' && <BookmarkTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default CorePage
