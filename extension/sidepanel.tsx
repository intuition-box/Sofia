import { useEffect } from "react"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureClient } from '@0xsofia/graphql'
import "./components/styles/Global.css"

import { wagmiConfig } from "./lib/config/wagmi"
import RouterProvider, { useRouter } from "./components/layout/RouterProvider"
import AppLayout from "./components/layout/AppLayout"
import BottomNavigation from "./components/layout/BottomNavigation"
import { useWalletFromStorage } from "./hooks/useWalletFromStorage"
import { useTheme } from "./hooks/useTheme"

// Pages
import HomePage from "./components/pages/HomePage"
import HomeConnectedPage from "./components/pages/HomeConnectedPage"
import SettingsPage from "./components/pages/SettingsPage"
import ProfilePage from "./components/pages/ProfilePage"
import CorePage from "./components/pages/CorePage"
import ResonancePage from "./components/pages/ResonancePage"
import ChatPage from "./components/pages/ChatPage"
import UserProfilePage from "./components/pages/UserProfilePage"
import DiscoveryProfilePage from "./components/pages/DiscoveryProfilePage"

// Configure GraphQL client BEFORE creating QueryClient
configureClient({
  apiUrl: 'https://mainnet.intuition.sh/v1/graphql'
})

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})


const SidePanelContent = () => {
  const { currentPage, navigateTo } = useRouter()

  // Read wallet from chrome.storage.session (set by tabs/auth.tsx via Privy)
  const { walletAddress, authenticated } = useWalletFromStorage()

  // Initialize theme on app load
  useTheme()

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
      case 'discovery-profile':
        return <DiscoveryProfilePage />
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

function SidePanel() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RouterProvider initialPage="home">
          <SidePanelContent />
        </RouterProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}


export default SidePanel
