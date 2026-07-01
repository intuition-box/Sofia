import { useState, useTransition, Suspense, lazy, useEffect } from 'react'
import SofiaLoader from '../ui/SofiaLoader'
import { useRouter } from '../layout/RouterProvider'
import '../styles/Global.css'
import '../styles/CorePage.css'

// Lazy load tab components
const EchoesTab = lazy(() => import('./core-tabs/EchoesTab'))
const BookmarkTab = lazy(() => import('./core-tabs/BookmarkTab'))
const HistoryTab = lazy(() => import('./core-tabs/HistoryTab'))

type MyProfileTab = 'Echoes' | 'Bookmarks' | 'History'

// Display labels — internal keys stay stable (external `initialTab` intents
// still reference 'Echoes'/'Bookmarks'); only the visible text changes.
const TAB_LABELS: Record<MyProfileTab, string> = {
  Echoes: 'Bookmark',
  Bookmarks: 'Collection',
  History: 'History'
}

const MyProfilePage = () => {
  const { myProfileIntent } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<MyProfileTab>(
    (myProfileIntent?.initialTab as MyProfileTab | undefined) ?? 'Echoes'
  )
  const [expandedHistoryTriplet, setExpandedHistoryTriplet] =
    useState<{ tripletId: string } | null>(null)
  const [, startTransition] = useTransition()

  // Switch to the requested tab whenever a new navigation intent lands.
  useEffect(() => {
    if (myProfileIntent?.initialTab) {
      setActiveGraphTab(myProfileIntent.initialTab as MyProfileTab)
    }
  }, [myProfileIntent])

  return (
    <div className="page">
      <div className="pf-echoes-sort core-page-tabs" role="group" aria-label="Switch view">
        {(['Echoes', 'Bookmarks', 'History'] as MyProfileTab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => startTransition(() => setActiveGraphTab(tab))}
            className={`pf-sort-btn ${activeGraphTab === tab ? 'active' : ''}`}
            aria-pressed={activeGraphTab === tab}
          >
            {TAB_LABELS[tab]}
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
        </Suspense>
      </div>
    </div>
  )
}

export default MyProfilePage
