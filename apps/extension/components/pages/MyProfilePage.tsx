import { useState, useTransition, Suspense, lazy } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))
const HistoryTab = lazy(() => import('./core-tabs/HistoryTab'))
const ConnectTab = lazy(() => import('./my-profile-tabs/SocialsTab'))

type MyProfileTab = 'Echoes' | 'Bookmarks' | 'History' | 'Connect'

const MyProfilePage = () => {
  const [activeGraphTab, setActiveGraphTab] = useState<MyProfileTab>('Echoes')
  const [expandedHistoryTriplet, setExpandedHistoryTriplet] =
    useState<{ tripletId: string } | null>(null)
  const [, startTransition] = useTransition()

  return (
    <div className="page">
      <div className="pf-echoes-sort core-page-tabs" role="group" aria-label="Switch view">
        {(['Echoes', 'Bookmarks', 'History', 'Connect'] as MyProfileTab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => startTransition(() => setActiveGraphTab(tab))}
            className={`pf-sort-btn ${activeGraphTab === tab ? 'active' : ''}`}
            aria-pressed={activeGraphTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense fallback={<div className="loading-state"><SofiaLoader size={150} /></div>}>
          {activeGraphTab === 'Echoes' && <EchoesTab />}
          {activeGraphTab === 'Bookmarks' && <BookmarkTab />}
          {activeGraphTab === 'History' && (
            <HistoryTab
              expandedTriplet={expandedHistoryTriplet}
              setExpandedTriplet={setExpandedHistoryTriplet}
            />
          )}
          {activeGraphTab === 'Connect' && <ConnectTab />}
        </Suspense>
      </div>
    </div>
  )
}

export default MyProfilePage
