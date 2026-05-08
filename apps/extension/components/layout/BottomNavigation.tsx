import { useState, useEffect } from 'react'
import { useWalletFromStorage, useQuestSystem, useCart } from '../../hooks'
import { useRouter } from './RouterProvider'
import { Pencil, User, Users, PieChart, Settings } from 'lucide-react'
import Dock, { DockItemData } from '../ui/NavigationBar'
import CartDrawer, { CartFab } from '../ui/CartDrawer'

const BottomNavigation = () => {
  const { walletAddress, authenticated } = useWalletFromStorage()
  const account = authenticated ? walletAddress : null
  const { navigateTo } = useRouter()
  const { claimableQuests } = useQuestSystem()
  const { count: cartCount } = useCart()
  const [showCartDrawer, setShowCartDrawer] = useState(false)

  // Allow other UI surfaces to request opening the cart drawer
  useEffect(() => {
    const open = () => setShowCartDrawer(true)
    window.addEventListener('sofia:open-cart', open)
    return () => window.removeEventListener('sofia:open-cart', open)
  }, [])

  if (!account) return null

  const hasClaimable = claimableQuests.length > 0

  const dockItems: DockItemData[] = [
    {
      icon: <Pencil size={24} />,
      label: 'Mark',
      onClick: () => navigateTo('mark')
    },
    {
      icon: <User size={24} />,
      label: 'My Profile',
      onClick: () => navigateTo('my-profile')
    },
    {
      icon: <Users size={24} />,
      label: 'Circles',
      onClick: () => navigateTo('circles')
    },
    {
      icon: <PieChart size={24} />,
      label: 'Score',
      onClick: () => navigateTo('score'),
      className: hasClaimable ? 'has-claimable' : ''
    },
    {
      icon: <Settings size={24} />,
      label: 'Settings',
      onClick: () => navigateTo('settings')
    }
  ]

  return (
    <>
      <CartFab
        count={cartCount}
        onClick={() => setShowCartDrawer(true)}
      />
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
