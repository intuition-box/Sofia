import { createPortal } from 'react-dom'
import SofiaLoader from './SofiaLoader'
import '../styles/FullScreenLoader.css'

interface FullScreenLoaderProps {
  isVisible: boolean
  message?: string
}

const FullScreenLoader = ({ isVisible, message }: FullScreenLoaderProps) => {
  if (!isVisible) return null

  return createPortal(
    <div className="fullscreen-loader-overlay">
      <div className="fullscreen-loader-content">
        <SofiaLoader size={150} />
        {message && <p className="fullscreen-loader-message">{message}</p>}
      </div>
    </div>,
    document.body
  )
}

export default FullScreenLoader
