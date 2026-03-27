import { useRouter } from '../../layout/RouterProvider'
import { createHookLogger } from '../../../lib/utils/logger'
import './CircularMenu.css'

const logger = createHookLogger('CircularMenu')

interface CircularMenuProps {
  isVisible: boolean
  onItemClick?: (item: string) => void
  onStartImport?: () => void
}

const CircularMenu = ({ isVisible, onItemClick, onStartImport }: CircularMenuProps) => {
  const { navigateTo, setOnboardingBookmarks } = useRouter()

  const menuItems = [
    {
      id: 'import-data',
      title: 'Import Data',
      gradient: 'linear-gradient(45deg, #f97d98, #d41f46)',
      position: 0,
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
        onStartImport?.()
        onItemClick?.('import-data')
        chrome.runtime.sendMessage({ type: 'FETCH_BOOKMARKS' }, (response) => {
          if (response?.success && response.bookmarks?.length > 0) {
            setOnboardingBookmarks(response.bookmarks)
            navigateTo('onboarding-select')
          }
        })
      }
    }
  ]

  const handleItemClick = (item: typeof menuItems[0]) => {
    item.action()
  }

  if (!isVisible) return null

  return (
    <>
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
    </>
  )
}

export default CircularMenu