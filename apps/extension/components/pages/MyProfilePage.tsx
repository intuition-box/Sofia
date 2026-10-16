import { lazy, Suspense, useEffect, useState, useTransition } from "react"

import { FEATURES } from "~/lib/config/features"

import { useRouter } from "../layout/RouterProvider"
import SofiaLoader from "../ui/SofiaLoader"

import "../styles/Global.css"
import "../styles/CorePage.css"

// Lazy load tab components
const EchoesTab = lazy(() => import("./core-tabs/EchoesTab"))
const BookmarkTab = lazy(() => import("./core-tabs/BookmarkTab"))
const HistoryTab = lazy(() => import("./core-tabs/HistoryTab"))

type MyProfileTab = "Echoes" | "Bookmarks" | "History"

// Display labels — internal keys stay stable (external `initialTab` intents
// still reference 'Echoes'/'Bookmarks'); only the visible text changes.
const TAB_LABELS: Record<MyProfileTab, string> = FEATURES.echoes
  ? { Echoes: "Bookmark", Bookmarks: "Collection", History: "Positions" }
  : { Echoes: "Bookmark", Bookmarks: "Bookmarks", History: "Positions" }

// Echoes is hidden behind a flag: the profile then shows Bookmarks + Positions.
const VISIBLE_TABS: MyProfileTab[] = FEATURES.echoes
  ? ["Echoes", "Bookmarks", "History"]
  : ["Bookmarks", "History"]

/** Map a requested tab onto a visible one (post-tx Echoes intents → Positions). */
const resolveTab = (tab?: MyProfileTab): MyProfileTab => {
  if (!tab) return VISIBLE_TABS[0]
  if (VISIBLE_TABS.includes(tab)) return tab
  return "History"
}

const MyProfilePage = () => {
  const { myProfileIntent } = useRouter()
  const [activeGraphTab, setActiveGraphTab] = useState<MyProfileTab>(
    resolveTab(myProfileIntent?.initialTab)
  )
  const [expandedHistoryTriplet, setExpandedHistoryTriplet] = useState<{
    tripletId: string
  } | null>(null)
  const [, startTransition] = useTransition()

  // Switch to the requested tab whenever a new navigation intent lands.
  useEffect(() => {
    if (myProfileIntent?.initialTab) {
      setActiveGraphTab(resolveTab(myProfileIntent.initialTab))
    }
  }, [myProfileIntent])

  return (
    <div className="page">
      <div
        className="pf-echoes-sort core-page-tabs"
        role="group"
        aria-label="Switch view">
        {VISIBLE_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => startTransition(() => setActiveGraphTab(tab))}
            className={`pf-sort-btn ${activeGraphTab === tab ? "active" : ""}`}
            aria-pressed={activeGraphTab === tab}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="page-content">
        <Suspense
          fallback={
            <div className="loading-state">
              <SofiaLoader size={150} />
            </div>
          }>
          {FEATURES.echoes && activeGraphTab === "Echoes" && <EchoesTab />}
          {activeGraphTab === "Bookmarks" && <BookmarkTab />}
          {activeGraphTab === "History" && (
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
