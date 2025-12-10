import { useWalletFromStorage } from '../../hooks/useWalletFromStorage'
import { useRouter } from './RouterProvider'
import { Home } from 'lucide-react'
import Dock, { DockItemData } from '../ui/NavigationBar'
import sofiaIcon from '../ui/icons/Icon=Sofia.svg'
import resonanceIcon from '../ui/icons/ResonanceIcon.svg'
import personIcon from '../ui/icons/Icon=person.svg'
import settingsIcon from '../ui/icons/Icon=Settings.svg'

const BottomNavigation = () => {
  const { walletAddress, authenticated } = useWalletFromStorage()
  const account = authenticated ? walletAddress : null
  const { navigateTo } = useRouter()

  if (!account) return null

  const dockItems: DockItemData[] = [
    {
      icon: <Home size={24} />,
      label: 'Home',
      onClick: () => navigateTo('home-connected')
    },
    {
      icon: <img src={sofiaIcon} alt="Sofia" style={{ width: '24px', height: '24px' }} />,
      label: 'Sofia',
      onClick: () => navigateTo('Sofia')
    },
    {
      icon: <img src={resonanceIcon} alt="Resonance" style={{ width: '24px', height: '24px' }} />,
      label: 'Resonance',
      onClick: () => navigateTo('resonance')
    },
    {
      icon: <img src={personIcon} alt="Profile" style={{ width: '24px', height: '24px' }} />,
      label: 'Profile',
      onClick: () => navigateTo('profile')
    },
    {
      icon: <img src={settingsIcon} alt="Settings" style={{ width: '24px', height: '24px' }} />,
      label: 'Settings',
      onClick: () => navigateTo('settings')
    }
  ]

  return (
    <Dock
      items={dockItems}
      panelHeight={80}
      baseItemSize={60}
      magnification={60}
    />
  )
}


export default BottomNavigation
