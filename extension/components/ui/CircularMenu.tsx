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
        <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" stroke="black" strokeWidth="2.8" fill="none" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" stroke="black" strokeWidth="4" fill="none" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(50, 50) translate(-12, -12) scale(1)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <path d="M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 4.172 4.306l-3.447 3.62a1 1 0 0 1-1.449 0z"/>
            </svg>
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
        <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" strokeWidth="2.8" fill="none" stroke="black" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" strokeWidth="4" fill="none" stroke="black" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(50, 50) translate(-12, -12) scale(1)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12"/>
              <path d="m8 11 4 4 4-4"/>
              <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"/>
            </svg>
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
        <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" strokeWidth="2.8" fill="none" stroke="black" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" strokeWidth="4" fill="none" stroke="black" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(50, 50) translate(-14, -14) scale(1)">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="5.05" stroke="black" strokeWidth="1.9"/>
              <circle cx="14" cy="14" r="9.05" stroke="black" strokeOpacity="0.5" strokeWidth="1.9"/>
              <circle cx="14" cy="14" r="13.05" stroke="black" strokeOpacity="0.2" strokeWidth="1.9"/>
            </svg>
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