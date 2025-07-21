import { createContext, useContext, useState } from 'react'

type Page = 'home' | 'settings' | 'home-connected' | 'my-graph' | 'recommendations' | 'saved' | 'search' | 'chat'

interface RouterContextType {
  currentPage: Page
  navigateTo: (page: Page) => void
  goBack: () => void
  history: Page[]
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

  const navigateTo = (page: Page) => {
    setCurrentPage(page)
    setHistory(prev => [...prev, page])
  }

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      const previousPage = newHistory[newHistory.length - 1]
      setHistory(newHistory)
      setCurrentPage(previousPage)
    }
  }

  const value: RouterContextType = {
    currentPage,
    navigateTo,
    goBack,
    history
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