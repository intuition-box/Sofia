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
      position: { left: 'calc(50% - 120px)', top: 'calc(50% - 120px)' },
      icon: (
        <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" stroke="black" strokeWidth="2.8" fill="none" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" stroke="black" strokeWidth="4" fill="none" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(30, 30) scale(1.3)">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" fill="black" />
            <path d="M7 9h10M7 11h6M7 13h8" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="18" cy="7" r="3" fill="red" opacity="0.8" />
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
      position: { left: 'calc(50% + 120px)', top: 'calc(50% - 120px)' },
      icon: (
        <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" strokeWidth="2.8" fill="none" stroke="black" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" strokeWidth="4" fill="none" stroke="black" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(32, 32) scale(1.1)">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14,2 14,8 20,8" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="18" x2="12" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <polyline points="9,15 12,12 15,15" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      ),
      action: () => {
        console.log('Import Data action')
        onItemClick?.('import-data')
      }
    },
    {
      id: 'capture-page',
      title: 'Capture Page',
      position: { left: 'calc(50% + 120px)', top: 'calc(50% + 120px)' },
      icon: (
        <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" strokeWidth="2.8" fill="none" stroke="black" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" strokeWidth="4" fill="none" stroke="black" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(28, 28) scale(1.4)">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      ),
      action: () => {
        console.log('Capture Page action')
        onItemClick?.('capture-page')
      }
    },
    {
      id: 'find-similar',
      title: 'Find Similar',
      position: { left: 'calc(50% - 120px)', top: 'calc(50% + 120px)' },
      icon: (
        <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle className="outer-circle" cx="50" cy="50" r="40" strokeWidth="2.8" fill="none" stroke="black" strokeDasharray="68.1 4.4 12.6 4.4" />
          <circle className="middle-circle" cx="50" cy="50" r="32" strokeWidth="4" fill="none" stroke="black" />
          <circle className="inner-circle" cx="50" cy="50" r="26" fill="white" />
          <g transform="translate(28, 28) scale(1.4)">
            <circle cx="11" cy="11" r="8" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m21 21-4.35-4.35" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="2" fill="black" />
            <circle cx="14" cy="8" r="2" fill="black" />
            <circle cx="8" cy="14" r="2" fill="black" />
            <circle cx="14" cy="14" r="2" fill="black" />
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