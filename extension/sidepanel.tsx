import { useEffect } from "react"
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
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
  const { currentPage, navigateTo } = useRouter()

  // Synchronize wallet with Privy and background script
  const { walletAddress, authenticated } = usePrivyWalletSync()

  // Automatic page management based on connection state
  useEffect(() => {
    if (authenticated && walletAddress && currentPage === 'home') {
      navigateTo('home-connected')
    } else if (!authenticated && currentPage !== 'home') {
      navigateTo('home')
    }
  }, [authenticated, walletAddress, currentPage, navigateTo])

  const renderCurrentPage = () => {
    if (!authenticated || !walletAddress) return <HomePage />

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
    <PrivyProvider appId={privyConfig.appId} clientId={privyConfig.clientId} config={privyConfig.config}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RouterProvider initialPage="home">
            <SidePanelContent />
          </RouterProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}


export default SidePanel