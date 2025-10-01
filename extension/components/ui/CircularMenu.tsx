import React, { useState } from 'react'
import { useRouter } from '../layout/RouterProvider'
import './CircularMenu.css'

interface CircularMenuProps {
  isVisible: boolean
  onItemClick?: (item: string) => void
}

const CircularMenu = ({ isVisible, onItemClick }: CircularMenuProps) => {
  const { navigateTo } = useRouter()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    {
      id: 'pulse-tab',
      title: 'Pulse Tab',
      position: { left: 'calc(50% - 140px)', top: 'calc(50% - 80px)' },
      icon: (
        <svg width="160px" height="160px" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{display: 'block', maxWidth: 'none', maxHeight: 'none'}}>
          <g transform="translate(40, 40) scale(4) translate(-12, -12)">
            <path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 4.172 4.306l-3.447 3.62a1 1 0 0 1-1.449 0z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </svg>
      ),
      action: () => {
        console.log('Pulse Tab action')
        onItemClick?.('pulse-tab')
      }
    },
    {
      id: 'import-data',
      title: 'Import Data',
      position: { left: 'calc(50% + 140px)', top: 'calc(50% - 80px)' },
      icon: (
        <svg width="160px" height="160px" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{display: 'block', maxWidth: 'none', maxHeight: 'none'}}>
          <g transform="translate(40, 40) scale(4) translate(-12, -12)">
            <path d="M12 3v12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="m8 11 4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </g>
        </svg>
      ),
      action: () => {
        console.log('Import Data action')
        onItemClick?.('import-data')
      }
    },
    {
      id: 'find-similar',
      title: 'Find Similar',
      position: { left: 'calc(50% + 0px)', top: 'calc(50% + 140px)' },
      icon: (
        <svg width="160px" height="160px" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style={{display: 'block', maxWidth: 'none', maxHeight: 'none'}}>
          <g transform="translate(40, 40) scale(4) translate(-14, -14)">
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
    <div className="circular-menu">
      {menuItems.map((item) => (
        <button
          key={item.id}
          className="arc-menu-button secondary-button"
          title={item.title}
          style={{
            left: item.position.left,
            top: item.position.top,
            transform: 'translate(-50%, -50%)'
          }}
          onMouseEnter={() => setHoveredItem(item.id)}
          onMouseLeave={() => setHoveredItem(null)}
          onClick={() => handleItemClick(item)}
        >
          {item.icon}
        </button>
      ))}
    </div>
  )
}

export default CircularMenu