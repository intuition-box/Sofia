import { useEffect } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import "./style.css"

import { wagmiConfig } from "./lib/utils/wagmi"
import RouterProvider, { useRouter } from "./components/layout/RouterProvider"
import AppLayout from "./components/layout/AppLayout"
import BottomNavigation from "./components/layout/BottomNavigation"
import { useWalletSync } from "./hooks/useWalletSync"

// Pages
import HomePage from "./components/pages/HomePage"
import HomeConnectedPage from "./components/pages/HomeConnectedPage"
import SettingsPage from "./components/pages/SettingsPage"
import ProfilePage from "./components/pages/ProfilePage"
import CorePage from "./components/pages/CorePage"
import RecommendationsPage from "./components/pages/RecommendationsPage"
import SyncPage from "./components/pages/SyncPage"
import SearchPage from "./components/pages/SearchPage"
import SearchResultPage from "./components/pages/SearchResultPage"
import ChatPage from "./components/pages/ChatPage"


const SidePanelContent = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()
  
  // Synchronize wallet connections
  useWalletSync()

  // Gestion automatique de la page selon l'état de connexion
  useEffect(() => {
    if (account && currentPage === 'home') {
      navigateTo('home-connected')
    } else if (!account && currentPage !== 'home') {
      navigateTo('home')
    }
  }, [account, currentPage, navigateTo])

  const renderCurrentPage = () => {
    if (!account) return <HomePage />
    
    switch (currentPage) {
      case 'home':
      case 'home-connected':
        return <HomeConnectedPage />
      case 'settings':
        return <SettingsPage />
      case 'profile':
        return <ProfilePage />
      case 'core':
        return <CorePage />
      case 'recommendations':
        return <RecommendationsPage />
      case 'sync':
        return <SyncPage />
      case 'search':
        return <SearchPage />
      case 'search-result':
        return <SearchResultPage />
      case 'chat':
        return <ChatPage />
      default:
        return <HomeConnectedPage />
    }
  }

  return (
    <AppLayout>
      {renderCurrentPage()}
      <BottomNavigation />
    </AppLayout>
  )
}

// Client de requête pour React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function SidePanel() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider initialPage="home">
          <SidePanelContent />
        </RouterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}


export default SidePanel