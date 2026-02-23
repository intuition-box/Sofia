import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { BookmarkData } from '~types/bookmarks'
import { createHookLogger } from '../../lib/utils/logger'

const logger = createHookLogger('RouterProvider')

type Page = 'home' | 'settings' | 'profile' | 'home-connected' | 'Sofia' | 'recommendations' | 'resonance' | 'chat' | 'user-profile' | 'discovery-profile' | 'onboarding-import' | 'onboarding-select' | 'onboarding-tutorial'

export interface UserProfileData {
  termId: string
  label: string
  image?: string
  walletAddress?: string
  url?: string
  description?: string
  initialTab?: string
}

interface SearchContext {
  query: string
  showResults: boolean
}

interface RouterContextType {
  currentPage: Page
  navigateTo: (page: Page, data?: any) => void
  goBack: () => void
  history: Page[]
  userProfileData: UserProfileData | null
  setUserProfileData: (data: UserProfileData | null) => void
  searchContext: SearchContext | null
  setSearchContext: (context: SearchContext | null) => void
  activeProfileTab: string | null
  setActiveProfileTab: (tab: string | null) => void
  onboardingBookmarks: BookmarkData[]
  setOnboardingBookmarks: (bookmarks: BookmarkData[]) => void
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

interface RouterProviderProps {
  children: any
  initialPage?: Page
}

export const RouterProvider = ({
  children,
  initialPage = 'home'
}: RouterProviderProps) => {
  const [currentPage, setCurrentPage] = useState<Page>(initialPage)
  const [history, setHistory] = useState<Page[]>([initialPage])
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null)
  const [searchContext, setSearchContext] = useState<SearchContext | null>(null)
  const [activeProfileTab, setActiveProfileTab] = useState<string | null>(null)
  const [onboardingBookmarks, setOnboardingBookmarks] = useState<BookmarkData[]>([])

  const navigateTo = (page: Page, data?: any) => {
    setCurrentPage(page)
    setHistory(prev => [...prev, page])

    // If navigating to user-profile, store the user data
    if (page === 'user-profile' && data) {
      setUserProfileData(data)
    } else if (page !== 'user-profile') {
      // Clear user profile data when navigating away
      setUserProfileData(null)
    }
  }

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      const previousPage = newHistory[newHistory.length - 1]
      setHistory(newHistory)
      setCurrentPage(previousPage)

      // Clear user profile data when going back from user-profile
      if (currentPage === 'user-profile') {
        setUserProfileData(null)
      }
    }
  }

  // Check for pending deep link profile navigation
  const handlePendingProfile = useCallback(async () => {
    try {
      const result = await chrome.storage.session.get('pending_profile_view')
      const pending = result.pending_profile_view
      if (pending?.walletAddress) {
        // Clear intent immediately to prevent re-navigation
        await chrome.storage.session.remove('pending_profile_view')
        navigateTo('user-profile', {
          termId: pending.termId || '',
          label: pending.label || '',
          walletAddress: pending.walletAddress,
        })
      }
    } catch (err) {
      logger.error('Failed to check pending profile', err)
    }
  }, [])

  // Check on mount (delayed to let sidepanel init complete) + listen for storage changes
  useEffect(() => {
    // Delay initial check so sidepanel onboarding/home redirect settles first
    const timeout = setTimeout(handlePendingProfile, 500)

    // Instant check when side panel is already open and a new deep link arrives
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'session' && changes.pending_profile_view?.newValue) {
        handlePendingProfile()
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => {
      clearTimeout(timeout)
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [handlePendingProfile])

  const value: RouterContextType = {
    currentPage,
    navigateTo,
    goBack,
    history,
    userProfileData,
    setUserProfileData,
    searchContext,
    setSearchContext,
    activeProfileTab,
    setActiveProfileTab,
    onboardingBookmarks,
    setOnboardingBookmarks
  }

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  )
}

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}

export default RouterProvider