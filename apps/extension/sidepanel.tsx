import { useEffect, useState } from "react"
import { WagmiProvider } from 'wagmi'
import { configureClient } from '@0xsofia/graphql'
import "./components/styles/Global.css"

import { wagmiConfig } from "./lib/config/wagmi"
import { QueryProvider } from "./lib/providers/queryProvider"
import RouterProvider, { useRouter } from "./components/layout/RouterProvider"
import AppLayout from "./components/layout/AppLayout"
import BottomNavigation from "./components/layout/BottomNavigation"
import { useWalletFromStorage } from "./hooks/useWalletFromStorage"

// Pages
import HomePage from "./components/pages/HomePage"
import MarkPage from "./components/pages/MarkPage"
import SettingsPage from "./components/pages/SettingsPage"
import MyProfilePage from "./components/pages/MyProfilePage"
import CirclesPage from "./components/pages/CirclesPage"
import ScorePage from "./components/pages/ScorePage"
import UserProfilePage from "./components/pages/UserProfilePage"
import OnboardingImportPage from "./components/pages/OnboardingImportPage"
import OnboardingTutorialPage from "./components/pages/OnboardingTutorialPage"
import OnboardingBookmarkSelectPage from "./components/pages/OnboardingBookmarkSelectPage"
import OnboardingClaimModal from "./components/modals/OnboardingClaimModal"
import { IntentionGroupsService } from "./lib/database/indexedDB-methods"

// Configure GraphQL client BEFORE the QueryProvider mounts
configureClient({
  apiUrl: 'https://mainnet.intuition.sh/v1/graphql'
})

const SidePanelContent = () => {
  const { currentPage, navigateTo, firstClaimData, setFirstClaimData } = useRouter()

  // Read wallet from chrome.storage.session (set by tabs/auth.tsx via Privy)
  const { walletAddress, authenticated } = useWalletFromStorage()
  const [, setOnboardingChecked] = useState(false)

  // Opening the side panel clears the browsing nudge: reset the counter so
  // the red icon badge falls back to the unpublished-echoes count.
  useEffect(() => {
    chrome.runtime.sendMessage({ type: "NUDGE_DISMISSED" }).catch(() => {})
  }, [])

  // Automatic page management based on connection state
  useEffect(() => {
    if (authenticated && walletAddress && currentPage === 'home') {
      // Onboarding is gated by consent, not by groups. Until the user has
      // explicitly accepted or declined browsing tracking we must route
      // them through onboarding-import — Chrome Web Store policy requires
      // consent before any data collection (including external-auth paths
      // that previously skipped onboarding).
      chrome.storage.sync.get('tracking_consent_seen').then(({ tracking_consent_seen }) => {
        if (!tracking_consent_seen) {
          chrome.storage.session.remove('pending_external_auth')
          navigateTo('onboarding-import')
          setOnboardingChecked(true)
          return
        }

        chrome.storage.session.get('pending_external_auth').then(result => {
          if (result.pending_external_auth) {
            chrome.storage.session.remove('pending_external_auth')
            navigateTo('mark')
            setOnboardingChecked(true)
            return
          }
          IntentionGroupsService.getAllGroups().then(groups => {
            if (groups.length === 0) {
              navigateTo('onboarding-import')
            } else {
              navigateTo('mark')
            }
            setOnboardingChecked(true)
          }).catch(() => {
            navigateTo('mark')
            setOnboardingChecked(true)
          })
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
      case 'mark':
        return <MarkPage />
      case 'settings':
        return <SettingsPage />
      case 'my-profile':
        return <MyProfilePage />
      case 'circles':
        return <CirclesPage />
      case 'score':
        return <ScorePage />
      case 'user-profile':
        return <UserProfilePage />
      case 'onboarding-import':
        return <OnboardingImportPage />
      case 'onboarding-select':
        return <OnboardingBookmarkSelectPage />
      case 'onboarding-tutorial':
        return <OnboardingTutorialPage />
      default:
        return <MarkPage />
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
    <QueryProvider>
      <WagmiProvider config={wagmiConfig}>
        <RouterProvider initialPage="home">
          <SidePanelContent />
        </RouterProvider>
      </WagmiProvider>
    </QueryProvider>
  )
}


export default SidePanel
