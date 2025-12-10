import { useEffect } from "react"
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureClient } from '@0xintuition/graphql'
import "./components/styles/Global.css"

import { wagmiConfig } from "./lib/config/wagmi"
import { privyConfig } from "./lib/config/privy"
import RouterProvider, { useRouter } from "./components/layout/RouterProvider"
import AppLayout from "./components/layout/AppLayout"
import BottomNavigation from "./components/layout/BottomNavigation"
import { usePrivyWalletSync } from "./hooks/usePrivyWalletSync"

// Pages
import HomePage from "./components/pages/HomePage"
import HomeConnectedPage from "./components/pages/HomeConnectedPage"
import SettingsPage from "./components/pages/SettingsPage"
import ProfilePage from "./components/pages/ProfilePage"
import CorePage from "./components/pages/CorePage"
import ResonancePage from "./components/pages/ResonancePage"
import ChatPage from "./components/pages/ChatPage"
import UserProfilePage from "./components/pages/UserProfilePage"


const SidePanelContent = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()
  
  // Synchronize wallet connections
  useWalletSync()

  // Automatic page management based on connection state
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
      case 'Sofia':
        return <CorePage />
      case 'resonance':
        return <ResonancePage />
      case 'chat':
        return <ChatPage />
      case 'user-profile':
        return <UserProfilePage />
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

// Configure GraphQL client to use testnet endpoint
configureClient({ 
  apiUrl: 'https://testnet.intuition.sh/v1/graphql' 
})

// Query client for React Query
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