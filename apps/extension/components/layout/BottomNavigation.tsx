import { Pencil, Settings, User, Users } from "lucide-react"
import { useEffect, useState } from "react"

import { FEATURES } from "~/lib/config/features"

import { useCart, useWalletFromStorage } from "../../hooks"
import CartDrawer, { CartFab } from "../ui/CartDrawer"
import Dock, { DockItemData } from "../ui/NavigationBar"
import { useRouter } from "./RouterProvider"

const BottomNavigation = () => {
  const { walletAddress, authenticated } = useWalletFromStorage()
  const account = authenticated ? walletAddress : null
  const { navigateTo } = useRouter()
  const { count: cartCount } = useCart()
  const [showCartDrawer, setShowCartDrawer] = useState(false)

  // Allow other UI surfaces to request opening the cart drawer
  useEffect(() => {
    const open = () => setShowCartDrawer(true)
    window.addEventListener("sofia:open-cart", open)
    return () => window.removeEventListener("sofia:open-cart", open)
  }, [])

  if (!account) return null

  // Page · My Profile · Settings. Hidden features (FEATURES flags) drop out
  // of the dock; their pages stay in the codebase.
  const dockItems: DockItemData[] = [
    {
      icon: <Pencil size={24} />,
      label: "Page",
      onClick: () => navigateTo("mark")
    },
    {
      icon: <User size={24} />,
      label: "My Profile",
      onClick: () => navigateTo("my-profile")
    },
    ...(FEATURES.circles
      ? [
          {
            icon: <Users size={24} />,
            label: "Circles",
            onClick: () => navigateTo("circles")
          }
        ]
      : []),
    {
      icon: <Settings size={24} />,
      label: "Settings",
      onClick: () => navigateTo("settings")
    }
  ]

  return (
    <>
      <CartFab count={cartCount} onClick={() => setShowCartDrawer(true)} />
      <CartDrawer
        isOpen={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
      />
      <Dock
        items={dockItems}
        panelHeight={80}
        baseItemSize={60}
        magnification={60}
      />
    </>
  )
}

export default BottomNavigation
