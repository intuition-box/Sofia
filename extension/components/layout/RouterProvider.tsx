import { createContext, useContext, useState } from 'react'

type Page = 'home' | 'settings' | 'profile' | 'home-connected' | 'Sofia' | 'recommendations' | 'resonance' | 'chat' | 'user-profile'

export interface UserProfileData {
  termId: string
  label: string
  image?: string
  walletAddress?: string
  url?: string
  description?: string
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
    setActiveProfileTab
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