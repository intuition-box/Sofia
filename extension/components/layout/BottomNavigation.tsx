import { useStorage } from "@plasmohq/storage/hook"
import { useRouter } from './RouterProvider'
import sofiaIcon from '../ui/icons/Icon=Sofia.svg'
import resonanceIcon from '../ui/icons/ResonanceIcon.svg'
import personIcon from '../ui/icons/Icon=person.svg'
import settingsIcon from '../ui/icons/Icon=Settings.svg'
import '../styles/BottomNavigation.css'

const BottomNavigation = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()

  if (!account) return null


  return (
    <div className="bottom-nav">
      <button 
        onClick={() => currentPage === 'Sofia' ? navigateTo('home-connected') : navigateTo('Sofia')}
        className={`nav-button ${currentPage === 'Sofia' ? 'active' : ''}`}
      >
        <img 
          src={sofiaIcon} 
          alt="Sofia" 
          className="nav-icon"
        />
        <span className="nav-text">Sofia</span>
      </button>
      <button 
        onClick={() => currentPage === 'resonance' ? navigateTo('home-connected') : navigateTo('resonance')}
        className={`nav-button ${currentPage === 'resonance' ? 'active' : ''}`}
      >
        <img 
          src={resonanceIcon} 
          alt="Resonance" 
          className="nav-icon"
        />
        <span className="nav-text">Resonance</span>
      </button>
      <button 
        onClick={() => currentPage === 'settings' ? navigateTo('home-connected') : navigateTo('settings')}
        className={`nav-button ${currentPage === 'settings' ? 'active' : ''}`}
      >
        <img 
          src={settingsIcon} 
          alt="Settings" 
          className="nav-icon"
        />
        <span className="nav-text">Settings</span>
      </button>
    </div>
  )
}


export default BottomNavigation