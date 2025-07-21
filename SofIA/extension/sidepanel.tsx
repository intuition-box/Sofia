import { useEffect } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"

import RouterProvider, { useRouter } from "./components/layout/RouterProvider"
import AppLayout from "./components/layout/AppLayout"
import BottomNavigation from "./components/layout/BottomNavigation"

// Pages
import HomePage from "./components/pages/HomePage"
import HomeConnectedPage from "./components/pages/HomeConnectedPage"
import SettingsPage from "./components/pages/SettingsPage"
import MyGraphPage from "./components/pages/MyGraphPage"
import RecommendationsPage from "./components/pages/RecommendationsPage"
import SavedPage from "./components/pages/SavedPage"
import SearchPage from "./components/pages/SearchPage"
import ChatPage from "./components/pages/ChatPage"

const SidePanelContent = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()

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
      case 'my-graph':
        return <MyGraphPage />
      case 'recommendations':
        return <RecommendationsPage />
      case 'saved':
        return <SavedPage />
      case 'search':
        return <SearchPage />
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

function SidePanel() {
  return (
    <RouterProvider initialPage="home">
      <SidePanelContent />
    </RouterProvider>
  )
}


export default SidePanel