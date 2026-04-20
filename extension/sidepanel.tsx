import { useEffect, useState } from "react"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureClient } from '@0xsofia/graphql'
import "./components/styles/Global.css"

import { wagmiConfig } from "./lib/config/wagmi"
import RouterProvider, { useRouter } from "./components/layout/RouterProvider"
import AppLayout from "./components/layout/AppLayout"
import BottomNavigation from "./components/layout/BottomNavigation"
import { useWalletFromStorage } from "./hooks/useWalletFromStorage"

// Pages
import HomePage from "./components/pages/HomePage"
import HomeConnectedPage from "./components/pages/HomeConnectedPage"
import SettingsPage from "./components/pages/SettingsPage"
import ProfilePage from "./components/pages/ProfilePage"
import CorePage from "./components/pages/CorePage"
import ResonancePage from "./components/pages/ResonancePage"
import UserProfilePage from "./components/pages/UserProfilePage"
import OnboardingImportPage from "./components/pages/OnboardingImportPage"
import OnboardingTutorialPage from "./components/pages/OnboardingTutorialPage"
import OnboardingBookmarkSelectPage from "./components/pages/OnboardingBookmarkSelectPage"
import OnboardingClaimModal from "./components/modals/OnboardingClaimModal"
import { IntentionGroupsService } from "./lib/database/indexedDB-methods"

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
  const { currentPage, navigateTo, firstClaimData, setFirstClaimData } = useRouter()

  // Read wallet from chrome.storage.session (set by tabs/auth.tsx via Privy)
  const { walletAddress, authenticated } = useWalletFromStorage()
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // Automatic page management based on connection state
  useEffect(() => {
    if (authenticated && walletAddress && currentPage === 'home') {
      // Check if connected from external auth page (landing page)
      // If so, skip onboarding-import and go to home-connected — wait for FIRST_CLAIM
      chrome.storage.session.get('pending_external_auth').then(result => {
        if (result.pending_external_auth) {
          chrome.storage.session.remove('pending_external_auth')
          navigateTo('home-connected')
          setOnboardingChecked(true)
          return
        }
        // Internal connection — check if user has local groups
        IntentionGroupsService.getAllGroups().then(groups => {
          if (groups.length === 0) {
            navigateTo('onboarding-import')
          } else {
            navigateTo('home-connected')
          }
          setOnboardingChecked(true)
        }).catch(() => {
          navigateTo('home-connected')
          setOnboardingChecked(true)
        })
      })
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
      case 'user-profile':
        return <UserProfilePage />
      case 'onboarding-import':
        return <OnboardingImportPage />
      case 'onboarding-select':
        return <OnboardingBookmarkSelectPage />
      case 'onboarding-tutorial':
        return <OnboardingTutorialPage />
      default:
        return <HomeConnectedPage />
    }
  }

  return (
    <AppLayout>
      {renderCurrentPage()}
      <BottomNavigation />
      {firstClaimData && (
        <OnboardingClaimModal
          isOpen={!!firstClaimData}
          url={firstClaimData.url}
          onClose={() => setFirstClaimData(null)}
          onComplete={() => {
            setFirstClaimData(null)
            navigateTo("onboarding-tutorial")
          }}
        />
      )}
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
