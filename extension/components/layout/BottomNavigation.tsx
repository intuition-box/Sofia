import { useStorage } from "@plasmohq/storage/hook"
import { useRouter } from './RouterProvider'
import sofiaIcon from '../../assets/Icon=Sofia.svg'
import searchIcon from '../../assets/Icon=Search.svg'
import personIcon from '../../assets/Icon=person.svg'
import settingsIcon from '../../assets/Icon=Settings.svg'
import '../styles/BottomNavigation.css'

const BottomNavigation = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()

  if (!account) return null


  return (
    <div className="bottom-nav">
      <button 
        onClick={() => navigateTo('Sofia')}
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
        onClick={() => navigateTo('search')}
        className={`nav-button ${currentPage === 'search' ? 'active' : ''}`}
      >
        <img 
          src={searchIcon} 
          alt="Search" 
          className="nav-icon"
        />
        <span className="nav-text">Search</span>
      </button>
      <button 
        onClick={() => navigateTo('profile')}
        className={`nav-button ${currentPage === 'profile' ? 'active' : ''}`}
      >
        <img 
          src={personIcon} 
          alt="Profile" 
          className="nav-icon"
        />
        <span className="nav-text">Profile</span>
      </button>
      <button 
        onClick={() => navigateTo('settings')}
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