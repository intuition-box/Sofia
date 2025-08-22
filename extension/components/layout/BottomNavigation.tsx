import { useStorage } from "@plasmohq/storage/hook"
import { useRouter } from './RouterProvider'
import { useState } from 'react'
import graphIcon from '../../assets/Icon=Graph.svg'
import coreIcon from '../../assets/Icon=access-point.svg'
import syncIcon from '../../assets/Icon=Sync.svg'
import searchIcon from '../../assets/Icon=Search.svg'
import personIcon from '../../assets/Icon=person.svg'
import settingsIcon from '../../assets/Icon=Settings.svg'
import '../styles/BottomNavigation.css'

const BottomNavigation = () => {
  const [account] = useStorage<string>("metamask-account")
  const { currentPage, navigateTo } = useRouter()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [lastHoveredIndex, setLastHoveredIndex] = useState<number>(0)

  if (!account) return null

  const getActiveIndex = () => {
    const pages = ['core', 'sync', 'search', 'profile', 'settings']
    return pages.indexOf(currentPage)
  }

  const activeIndex = getActiveIndex()
  
  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
    setLastHoveredIndex(index)
  }


  const handleContainerMouseLeave = () => {
    setHoveredIndex(null)
  }

  return (
    <div className="bottom-nav" onMouseLeave={handleContainerMouseLeave}>
      <div 
        className="nav-background" 
        style={{ 
          left: `calc(${activeIndex * 20}% + 10% - 30px)`,
          transform: 'none'
        }}
      />
      <div 
        className="nav-hover-background" 
        style={{ 
          left: `calc(${(hoveredIndex !== null ? hoveredIndex : lastHoveredIndex) * 20}% + 10% - 30px)`,
          top: hoveredIndex !== null ? '8px' : '-50px',
          opacity: hoveredIndex !== null ? 1 : 0
        }}
      />
      <button 
        onClick={() => navigateTo('core')}
        onMouseEnter={() => handleMouseEnter(0)}
        className={`nav-button ${currentPage === 'core' ? 'active' : ''}`}
      >
        <img 
          src={coreIcon} 
          alt="Core" 
          className="nav-icon"
        />
        <span className="nav-text">Core</span>
      </button>
      <button 
        onClick={() => navigateTo('sync')}
        onMouseEnter={() => handleMouseEnter(1)}
        className={`nav-button ${currentPage === 'sync' ? 'active' : ''}`}
      >
        <img 
          src={syncIcon} 
          alt="Sync" 
          className="nav-icon"
        />
        <span className="nav-text">Sync</span>
      </button>
      <button 
        onClick={() => navigateTo('search')}
        onMouseEnter={() => handleMouseEnter(2)}
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
        onMouseEnter={() => handleMouseEnter(3)}
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
        onMouseEnter={() => handleMouseEnter(4)}
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