import { useEffect, useState, ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
}

const Portal = ({ children }: PortalProps) => {
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Create portal container
    const portalDiv = document.createElement('div')
    portalDiv.id = 'bookmark-modal-portal'
    portalDiv.style.position = 'fixed'
    portalDiv.style.top = '0'
    portalDiv.style.left = '0'
    portalDiv.style.width = '100%'
    portalDiv.style.height = '100%'
    portalDiv.style.zIndex = '9999'
    portalDiv.style.pointerEvents = 'none'

    document.body.appendChild(portalDiv)
    setPortalElement(portalDiv)

    return () => {
      if (document.body.contains(portalDiv)) {
        document.body.removeChild(portalDiv)
      }
      setPortalElement(null)
    }
  }, [])

  if (!portalElement) return null

  return createPortal(children, portalElement)
}

export default Portal