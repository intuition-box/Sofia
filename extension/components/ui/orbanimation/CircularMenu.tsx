import { useRouter } from '../../layout/RouterProvider'
import './CircularMenu.css'

interface CircularMenuProps {
  isVisible: boolean
  onItemClick?: (item: string) => void
  onStartAnalysis?: () => void
}

const CircularMenu = ({ isVisible, onItemClick, onStartAnalysis }: CircularMenuProps) => {
  const { navigateTo } = useRouter()

  const menuItems = [
    {
      id: 'pulse-tab',
      title: 'Pulse Analysis',
      gradient: 'linear-gradient(45deg, #62daca, #10d4a9)',
      position: 0,
      icon: (
        <svg width="30px" height="30px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(24, 24) scale(2) translate(-12, -12)">
            <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 4.172 4.306l-3.447 3.62a1 1 0 0 1-1.449 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </svg>
      ),
      action: () => {
        if (confirm('Collect pulse data from all open tabs?')) {
          chrome.runtime.sendMessage({ type: 'START_PULSE_ANALYSIS' })
          onStartAnalysis?.()
        }
        onItemClick?.('pulse-tab')
      }
    },
    {
      id: 'import-data',
      title: 'Import Data',
      gradient: 'linear-gradient(45deg, #f97d98, #d41f46)',
      position: 1,
      icon: (
        <svg width="30px" height="30px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(24, 24) scale(2) translate(-12, -12)">
            <path d="M12 3v12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="m8 11 4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </svg>
      ),
      action: () => {
        if (confirm('Import all your browser bookmarks?')) {
          chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' })
        }
        localStorage.setItem('targetTab', 'Echoes')
        navigateTo('Sofia')
        onItemClick?.('import-data')
      }
    },
    {
      id: 'find-similar',
      title: 'Find Similar',
      gradient: 'linear-gradient(45deg, aliceblue, #d169d1)',
      position: 2,
      icon: (
        <svg width="30px" height="30px" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(24, 24) scale(1.5) translate(-14, -14)">
            <circle cx="14" cy="14" r="5.05" stroke="white" strokeWidth="1.9" fill="none"/>
            <circle cx="14" cy="14" r="9.05" stroke="white" strokeOpacity="0.5" strokeWidth="1.9" fill="none"/>
            <circle cx="14" cy="14" r="13.05" stroke="white" strokeOpacity="0.2" strokeWidth="1.9" fill="none"/>
          </g>
        </svg>
      ),
      action: () => {
        console.log('Find Similar action')
        onItemClick?.('find-similar')
      }
    }
  ]

  const handleItemClick = (item: typeof menuItems[0]) => {
    item.action()
  }

  if (!isVisible) return null

  return (
    <aside className="menu-tooltip-container">
      <input type="checkbox" id="menu-toggle" checked={isVisible} readOnly />
      {menuItems.map((item) => (
        <li
          key={item.id}
          style={{ '--i': item.position } as React.CSSProperties}
          className="circle-box"
        >
          <a
            href="#"
            className="anchor"
            onClick={(e) => {
              e.preventDefault()
              handleItemClick(item)
            }}
            style={{
              background: item.gradient
            }}
            title={item.title}
          >
            {item.icon}
          </a>
        </li>
      ))}
    </aside>
  )
}

export default CircularMenu